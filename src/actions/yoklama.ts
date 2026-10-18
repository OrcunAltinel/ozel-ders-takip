"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { oturumGetir } from "@/lib/auth/oturum";
import type { IslemSonucu } from "@/lib/islem-sonucu";
import { bugununTarihi } from "@/lib/zaman/istanbul";

const idSemasi = z.uuid();

const yoklamaSemasi = z
  .array(
    z.object({
      ogrenciId: z.uuid(),
      durum: z.enum(["geldi", "gelmedi"]),
    }),
  )
  .max(200);

export type YoklamaKaydi = z.input<typeof yoklamaSemasi>[number];

function sayfalariYenile(dersId: string) {
  revalidatePath("/", "layout");
  revalidatePath(`/dersler/${dersId}`);
}

/**
 * Dersin yoklamasını kaydeder (ilk kez veya güncelleme) ve dersi "yapıldı"
 * olarak işaretler. Ücret veritabanı tetikleyicisi tarafından ilk kayıtta
 * öğrenci > grup > varsayılan saatlik ücretten hesaplanır; güncellemede (ör. gelmedi → geldi) eski ücret
 * korunur.
 */
export async function yoklamaKaydet(
  dersId: string,
  kayitlar: YoklamaKaydi[],
): Promise<IslemSonucu> {
  const sonuc = yoklamaSemasi.safeParse(kayitlar);
  if (!sonuc.success || !idSemasi.safeParse(dersId).success) {
    return { hata: "Yoklama bilgileri geçersiz." };
  }
  const ogrenciIdleri = sonuc.data.map((k) => k.ogrenciId);
  if (new Set(ogrenciIdleri).size !== ogrenciIdleri.length) {
    return { hata: "Yoklama bilgileri geçersiz." };
  }

  const { supabase, kullanici } = await oturumGetir();

  const { data: ders } = await supabase
    .from("dersler")
    .select("id, tarih, durum")
    .eq("id", dersId)
    .eq("hoca_id", kullanici.id)
    .maybeSingle();

  if (!ders) return { hata: "Ders bulunamadı." };
  if (ders.durum === "iptal") {
    return {
      hata: "İptal edilmiş dersin yoklaması alınamaz. Önce iptali geri alın.",
    };
  }
  if (ders.tarih > bugununTarihi()) {
    return { hata: "Henüz yapılmamış bir dersin yoklaması alınamaz." };
  }

  if (sonuc.data.length > 0) {
    const { error } = await supabase.from("yoklamalar").upsert(
      sonuc.data.map((k) => ({
        hoca_id: kullanici.id,
        ders_id: dersId,
        ogrenci_id: k.ogrenciId,
        durum: k.durum,
        // Gerçek ücret tetikleyici tarafından belirlenir; bu değer yok sayılır.
        ucret: 0,
      })),
      { onConflict: "ders_id,ogrenci_id" },
    );
    if (error) {
      // Tetikleyici: öğrencinin, grubun ve hocanın hiçbir saatlik ücreti yok.
      if (error.message.includes("Saatlik ücret belirlenmemiş")) {
        return {
          hata: "Bazı öğrenciler için saatlik ücret belirlenmemiş. Ayarlar'dan varsayılan ücreti ya da grup/öğrenci ücretini girin.",
        };
      }
      return { hata: "Yoklama kaydedilemedi. Lütfen tekrar deneyin." };
    }
  }

  const { error: dersHatasi } = await supabase
    .from("dersler")
    .update({ durum: "yapildi" })
    .eq("id", dersId)
    .eq("hoca_id", kullanici.id);
  if (dersHatasi) {
    return { hata: "Yoklama kaydedildi ancak ders durumu güncellenemedi." };
  }

  sayfalariYenile(dersId);
  return { basarili: true };
}

/**
 * Dersin yoklamasını tamamen siler ve dersi tekrar "planlı" yapar (yanlış
 * derse alınan yoklamayı düzeltmek için). Öğrencilerin borcundan ilgili
 * ders ücretleri düşer.
 */
export async function yoklamayiGeriAl(dersId: string): Promise<IslemSonucu> {
  if (!idSemasi.safeParse(dersId).success) return { hata: "Geçersiz istek." };

  const { supabase, kullanici } = await oturumGetir();

  const { error } = await supabase
    .from("yoklamalar")
    .delete()
    .eq("ders_id", dersId)
    .eq("hoca_id", kullanici.id);
  if (error) return { hata: "Yoklama silinemedi. Lütfen tekrar deneyin." };

  const { data, error: dersHatasi } = await supabase
    .from("dersler")
    .update({ durum: "planli" })
    .eq("id", dersId)
    .eq("hoca_id", kullanici.id)
    .select("id");
  if (dersHatasi || !data?.length) {
    return { hata: "Ders durumu güncellenemedi. Lütfen tekrar deneyin." };
  }

  sayfalariYenile(dersId);
  return { basarili: true };
}
