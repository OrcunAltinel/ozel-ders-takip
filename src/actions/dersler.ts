"use server";

import { revalidatePath } from "next/cache";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { z } from "zod";
import { oturumGetir } from "@/lib/auth/oturum";
import type { IslemSonucu } from "@/lib/islem-sonucu";
import { saatKisalt, tarihinHaftaGunu } from "@/lib/zaman/saat";
import {
  dersDuzenleSemasi,
  dersOlusturSemasi,
  tarihSemasi,
  type DersDuzenleGirdisi,
  type DersOlusturGirdisi,
} from "@/lib/validasyon/ders";

const idSemasi = z.uuid();

/** Takvimin tek seferde isteyebileceği en geniş aralık (aylık görünüm ~6 hafta). */
const EN_FAZLA_GUN = 62;

export type DersDurumu = "planli" | "yapildi" | "iptal";

export type TakvimDersi = {
  id: string;
  grupId: string;
  grupAdi: string;
  renk: string;
  tarih: string;
  baslangicSaati: string;
  bitisSaati: string;
  durum: DersDurumu;
  konu: string | null;
  /** Haftalık programdan üretilmiş ders mi? */
  tekrarlayan: boolean;
  yoklamaVar: boolean;
};

/**
 * Verilen tarih aralığındaki (iki uç dahil) dersleri döner. Önce tekrarlayan
 * programlardan eksik dersler üretilir (idempotent).
 */
export async function takvimDersleriniGetir(
  baslangic: string,
  bitis: string,
): Promise<{ hata: string } | { dersler: TakvimDersi[] }> {
  if (
    !tarihSemasi.safeParse(baslangic).success ||
    !tarihSemasi.safeParse(bitis).success
  ) {
    return { hata: "Geçersiz tarih aralığı." };
  }
  const gunFarki = differenceInCalendarDays(parseISO(bitis), parseISO(baslangic));
  if (gunFarki < 0 || gunFarki > EN_FAZLA_GUN) {
    return { hata: "Geçersiz tarih aralığı." };
  }

  const { supabase, kullanici } = await oturumGetir();

  const { error: uretimHatasi } = await supabase.rpc("dersleri_uret", {
    p_baslangic: baslangic,
    p_bitis: bitis,
  });
  if (uretimHatasi) return { hata: "Dersler yüklenemedi. Lütfen tekrar deneyin." };

  const { data, error } = await supabase
    .from("dersler")
    .select(
      "id, grup_id, tarih, baslangic_saati, bitis_saati, durum, konu, program_id, gruplar(ad, renk), yoklamalar(count)",
    )
    .eq("hoca_id", kullanici.id)
    .gte("tarih", baslangic)
    .lte("tarih", bitis)
    .order("tarih")
    .order("baslangic_saati");

  if (error) return { hata: "Dersler yüklenemedi. Lütfen tekrar deneyin." };

  return {
    dersler: data.map((d) => ({
      id: d.id,
      grupId: d.grup_id,
      grupAdi: d.gruplar?.ad ?? "",
      renk: d.gruplar?.renk ?? "#4b5563",
      tarih: d.tarih,
      baslangicSaati: saatKisalt(d.baslangic_saati),
      bitisSaati: saatKisalt(d.bitis_saati),
      durum: d.durum as DersDurumu,
      konu: d.konu,
      tekrarlayan: d.program_id !== null,
      yoklamaVar: (d.yoklamalar[0]?.count ?? 0) > 0,
    })),
  };
}

/**
 * Takvimden yeni ders oluşturur. "Her hafta tekrarla" seçiliyse tek bir
 * ders yerine grubun haftalık programına bir satır eklenir; dersler
 * takvim görüntülendikçe bu programdan üretilir.
 */
export async function dersOlustur(
  girdi: DersOlusturGirdisi,
): Promise<IslemSonucu> {
  const sonuc = dersOlusturSemasi.safeParse(girdi);
  if (!sonuc.success || !idSemasi.safeParse(sonuc.data.grupId).success) {
    return { hata: "Form bilgileri geçersiz." };
  }

  const { supabase, kullanici } = await oturumGetir();
  const v = sonuc.data;

  const { data: grup } = await supabase
    .from("gruplar")
    .select("id")
    .eq("id", v.grupId)
    .eq("hoca_id", kullanici.id)
    .is("arsivlendi_at", null)
    .maybeSingle();
  if (!grup) return { hata: "Grup bulunamadı." };

  const { error } = v.tekrarla
    ? await supabase.from("ders_programlari").insert({
        hoca_id: kullanici.id,
        grup_id: v.grupId,
        haftanin_gunu: tarihinHaftaGunu(v.tarih),
        baslangic_saati: v.baslangicSaati,
        bitis_saati: v.bitisSaati,
        baslangic_tarihi: v.tarih,
        bitis_tarihi: v.tekrarBitisTarihi || null,
      })
    : await supabase.from("dersler").insert({
        hoca_id: kullanici.id,
        grup_id: v.grupId,
        tarih: v.tarih,
        baslangic_saati: v.baslangicSaati,
        bitis_saati: v.bitisSaati,
        konu: v.konu || null,
      });

  if (error) return { hata: "Ders oluşturulamadı. Lütfen tekrar deneyin." };

  revalidatePath("/", "layout");
  return { basarili: true };
}

/**
 * Tek bir dersin tarih/saat/konusunu değiştirir (sürükle-bırak dahil).
 * Programdan üretilmiş derste yalnızca o tarihteki ders değişir; program
 * ve diğer haftalar etkilenmez.
 */
export async function dersGuncelle(
  dersId: string,
  girdi: DersDuzenleGirdisi,
): Promise<IslemSonucu> {
  const sonuc = dersDuzenleSemasi.safeParse(girdi);
  if (!sonuc.success || !idSemasi.safeParse(dersId).success) {
    return { hata: "Form bilgileri geçersiz." };
  }

  const { supabase, kullanici } = await oturumGetir();
  const v = sonuc.data;

  const { data, error } = await supabase
    .from("dersler")
    .update({
      tarih: v.tarih,
      baslangic_saati: v.baslangicSaati,
      bitis_saati: v.bitisSaati,
      konu: v.konu || null,
    })
    .eq("id", dersId)
    .eq("hoca_id", kullanici.id)
    .select("id");

  if (error || !data?.length) {
    return { hata: "Ders güncellenemedi. Lütfen tekrar deneyin." };
  }

  revalidatePath("/", "layout");
  return { basarili: true };
}

/** Dersi iptal eder veya iptali geri alır. Yoklaması alınmış ders iptal edilemez. */
export async function dersIptalDurumunuDegistir(
  dersId: string,
  iptal: boolean,
): Promise<IslemSonucu> {
  if (!idSemasi.safeParse(dersId).success) return { hata: "Geçersiz istek." };

  const { supabase, kullanici } = await oturumGetir();

  const { count } = await supabase
    .from("yoklamalar")
    .select("id", { count: "exact", head: true })
    .eq("ders_id", dersId);
  if (count) {
    return { hata: "Yoklaması alınmış bir ders iptal edilemez." };
  }

  const { data, error } = await supabase
    .from("dersler")
    .update({ durum: iptal ? "iptal" : "planli" })
    .eq("id", dersId)
    .eq("hoca_id", kullanici.id)
    .in("durum", ["planli", "iptal"])
    .select("id");

  if (error || !data?.length) {
    return { hata: "Ders durumu değiştirilemedi. Lütfen tekrar deneyin." };
  }

  revalidatePath("/", "layout");
  return { basarili: true };
}

/**
 * Tek seferlik bir dersi siler. Programdan üretilen dersler silinemez
 * (silinirse takvim tekrar ürettiğinde geri gelirdi) — onlar iptal edilir.
 * Yoklaması olan ders veritabanı tetikleyicisi tarafından da korunur.
 */
export async function dersSil(dersId: string): Promise<IslemSonucu> {
  if (!idSemasi.safeParse(dersId).success) return { hata: "Geçersiz istek." };

  const { supabase, kullanici } = await oturumGetir();

  const { data: ders } = await supabase
    .from("dersler")
    .select("id, program_id")
    .eq("id", dersId)
    .eq("hoca_id", kullanici.id)
    .maybeSingle();

  if (!ders) return { hata: "Ders bulunamadı." };
  if (ders.program_id !== null) {
    return {
      hata: "Haftalık programdan gelen ders silinemez; bunun yerine iptal edin.",
    };
  }

  const { error } = await supabase
    .from("dersler")
    .delete()
    .eq("id", dersId)
    .eq("hoca_id", kullanici.id);

  if (error) {
    return {
      hata: error.message.includes("Yoklaması")
        ? "Yoklaması alınmış bir ders silinemez."
        : "Ders silinemedi. Lütfen tekrar deneyin.",
    };
  }

  revalidatePath("/", "layout");
  return { basarili: true };
}
