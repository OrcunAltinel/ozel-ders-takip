"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { oturumGetir } from "@/lib/auth/oturum";
import type { IslemSonucu } from "@/lib/islem-sonucu";
import { bugununTarihi } from "@/lib/zaman/istanbul";
import {
  programSemasi,
  tarihSemasi,
  type ProgramGirdisi,
} from "@/lib/validasyon/ders";

const idSemasi = z.uuid();

function kolonlaraCevir(v: z.output<typeof programSemasi>) {
  return {
    haftanin_gunu: v.haftaninGunu,
    baslangic_saati: v.baslangicSaati,
    bitis_saati: v.bitisSaati,
    baslangic_tarihi: v.baslangicTarihi,
    bitis_tarihi: v.bitisTarihi || null,
  };
}

function sayfalariYenile(grupId: string) {
  revalidatePath(`/gruplar/${grupId}`);
  revalidatePath("/", "layout");
}

export async function programOlustur(
  grupId: string,
  girdi: ProgramGirdisi,
): Promise<IslemSonucu> {
  const sonuc = programSemasi.safeParse(girdi);
  if (!sonuc.success || !idSemasi.safeParse(grupId).success) {
    return { hata: "Form bilgileri geçersiz." };
  }

  const { supabase, kullanici } = await oturumGetir();

  const { data: grup } = await supabase
    .from("gruplar")
    .select("id")
    .eq("id", grupId)
    .eq("hoca_id", kullanici.id)
    .is("arsivlendi_at", null)
    .maybeSingle();
  if (!grup) return { hata: "Grup bulunamadı." };

  const { error } = await supabase.from("ders_programlari").insert({
    hoca_id: kullanici.id,
    grup_id: grupId,
    ...kolonlaraCevir(sonuc.data),
  });

  if (error) return { hata: "Program eklenemedi. Lütfen tekrar deneyin." };

  sayfalariYenile(grupId);
  return { basarili: true };
}

/**
 * Programı günceller. Değişiklik bugünden itibaren geçerlidir: bugün ve
 * sonrasındaki, yoklaması alınmamış dersleri silinir ve takvim
 * görüntülendiğinde yeni gün/saatle yeniden üretilir. Geçmiş dersler
 * olduğu gibi kalır.
 */
export async function programGuncelle(
  programId: string,
  girdi: ProgramGirdisi,
): Promise<IslemSonucu> {
  const sonuc = programSemasi.safeParse(girdi);
  if (!sonuc.success || !idSemasi.safeParse(programId).success) {
    return { hata: "Form bilgileri geçersiz." };
  }

  const { supabase, kullanici } = await oturumGetir();
  const bugun = bugununTarihi();

  const { data: mevcut } = await supabase
    .from("ders_programlari")
    .select("baslangic_tarihi")
    .eq("id", programId)
    .eq("hoca_id", kullanici.id)
    .maybeSingle();
  if (!mevcut) return { hata: "Program bulunamadı." };

  const yeni = kolonlaraCevir(sonuc.data);
  // Zaten başlamış bir program geriye dönük değiştirilemez: aksi halde
  // ör. gün değişince geçmiş haftalara yeni günde ders üretilirdi.
  if (mevcut.baslangic_tarihi < bugun && yeni.baslangic_tarihi < bugun) {
    yeni.baslangic_tarihi = bugun;
  }
  if (yeni.bitis_tarihi && yeni.bitis_tarihi < yeni.baslangic_tarihi) {
    return {
      hata: "Son hafta bugünden önce olamaz. Programı bitirmek için \"Programı sonlandır\"ı kullanın.",
    };
  }

  const { data, error } = await supabase
    .from("ders_programlari")
    .update(yeni)
    .eq("id", programId)
    .eq("hoca_id", kullanici.id)
    .select("grup_id");

  if (error || !data?.length) {
    return { hata: "Program güncellenemedi. Lütfen tekrar deneyin." };
  }

  const { error: temizlikHatasi } = await supabase.rpc(
    "program_derslerini_temizle",
    { p_program_id: programId, p_tarihten: bugun },
  );
  if (temizlikHatasi) {
    return {
      hata: "Program güncellendi ancak gelecek dersler yenilenemedi. Sayfayı yenileyip tekrar deneyin.",
    };
  }

  sayfalariYenile(data[0].grup_id);
  return { basarili: true };
}

/**
 * Programı verilen son ders tarihinde bitirir; sonraki dersler takvimden
 * kalkar. Hiç geçmiş dersi olmayan program tamamen silinir.
 */
export async function programiSonlandir(
  programId: string,
  sonTarih: string,
): Promise<{ hata: string } | { sonuc: "silindi" | "sonlandirildi" }> {
  if (
    !idSemasi.safeParse(programId).success ||
    !tarihSemasi.safeParse(sonTarih).success
  ) {
    return { hata: "Geçersiz istek." };
  }

  const { supabase, kullanici } = await oturumGetir();

  const { data: program } = await supabase
    .from("ders_programlari")
    .select("grup_id")
    .eq("id", programId)
    .eq("hoca_id", kullanici.id)
    .maybeSingle();
  if (!program) return { hata: "Program bulunamadı." };

  const { data, error } = await supabase.rpc("programi_sonlandir", {
    p_program_id: programId,
    p_son_tarih: sonTarih,
  });

  if (error) return { hata: "Program sonlandırılamadı. Lütfen tekrar deneyin." };

  sayfalariYenile(program.grup_id);
  return { sonuc: data === "silindi" ? "silindi" : "sonlandirildi" };
}
