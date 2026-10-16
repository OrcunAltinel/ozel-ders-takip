"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { oturumGetir } from "@/lib/auth/oturum";
import type { IslemSonucu } from "@/lib/islem-sonucu";
import { telefonNormallestir } from "@/lib/telefon";
import { ogrenciSemasi, type OgrenciGirdisi } from "@/lib/validasyon/ogrenci";

const idSemasi = z.uuid();

/** Doğrulanmış form verisini veritabanı kolonlarına çevirir. */
function kolonlaraCevir(veri: z.output<typeof ogrenciSemasi>) {
  return {
    ad_soyad: veri.adSoyad,
    telefon: telefonNormallestir(veri.telefon),
    veli_ad: veri.veliAd || null,
    veli_telefon: telefonNormallestir(veri.veliTelefon),
    grup_id: veri.grupId || null,
    notlar: veri.notlar || null,
  };
}

function sayfalariYenile(ogrenciId?: string) {
  revalidatePath("/ogrenciler");
  revalidatePath("/gruplar", "layout");
  if (ogrenciId) revalidatePath(`/ogrenciler/${ogrenciId}`);
}

export async function ogrenciOlustur(
  girdi: OgrenciGirdisi,
): Promise<IslemSonucu> {
  const sonuc = ogrenciSemasi.safeParse(girdi);
  if (!sonuc.success) return { hata: "Form bilgileri geçersiz." };
  if (sonuc.data.grupId && !idSemasi.safeParse(sonuc.data.grupId).success) {
    return { hata: "Geçersiz grup seçimi." };
  }

  const { supabase, kullanici } = await oturumGetir();

  const { error } = await supabase.from("ogrenciler").insert({
    hoca_id: kullanici.id,
    ...kolonlaraCevir(sonuc.data),
  });

  if (error) return { hata: "Öğrenci eklenemedi. Lütfen tekrar deneyin." };

  sayfalariYenile();
  return { basarili: true };
}

export async function ogrenciGuncelle(
  ogrenciId: string,
  girdi: OgrenciGirdisi,
): Promise<IslemSonucu> {
  const sonuc = ogrenciSemasi.safeParse(girdi);
  if (!sonuc.success || !idSemasi.safeParse(ogrenciId).success) {
    return { hata: "Form bilgileri geçersiz." };
  }
  if (sonuc.data.grupId && !idSemasi.safeParse(sonuc.data.grupId).success) {
    return { hata: "Geçersiz grup seçimi." };
  }

  const { supabase, kullanici } = await oturumGetir();

  const { data, error } = await supabase
    .from("ogrenciler")
    .update(kolonlaraCevir(sonuc.data))
    .eq("id", ogrenciId)
    .eq("hoca_id", kullanici.id)
    // Arşivdeki öğrenci düzenlenemez (önce arşivden çıkarılmalı).
    .is("arsivlendi_at", null)
    .select("id");

  if (error || !data?.length) {
    return { hata: "Öğrenci güncellenemedi. Lütfen tekrar deneyin." };
  }

  sayfalariYenile(ogrenciId);
  return { basarili: true };
}
