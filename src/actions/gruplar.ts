"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { oturumGetir } from "@/lib/auth/oturum";
import type { IslemSonucu } from "@/lib/islem-sonucu";
import { tutarCozumle } from "@/lib/para";
import {
  ogrenciUcretiSemasi,
  type OgrenciUcretiGirdisi,
} from "@/lib/validasyon/ayarlar";
import { grupSemasi, type GrupGirdisi } from "@/lib/validasyon/grup";

const idSemasi = z.uuid();

function sayfalariYenile(grupId?: string) {
  revalidatePath("/gruplar");
  revalidatePath("/ogrenciler");
  if (grupId) revalidatePath(`/gruplar/${grupId}`);
}

export async function grupOlustur(girdi: GrupGirdisi): Promise<IslemSonucu> {
  const sonuc = grupSemasi.safeParse(girdi);
  if (!sonuc.success) return { hata: "Form bilgileri geçersiz." };

  const { supabase, kullanici } = await oturumGetir();
  const { ad, aciklama, renk, saatlikUcret } = sonuc.data;

  const { error } = await supabase.from("gruplar").insert({
    hoca_id: kullanici.id,
    ad,
    aciklama: aciklama || null,
    renk,
    saatlik_ucret: tutarCozumle(saatlikUcret),
  });

  if (error) return { hata: "Grup oluşturulamadı. Lütfen tekrar deneyin." };

  sayfalariYenile();
  return { basarili: true };
}

export async function grupGuncelle(
  grupId: string,
  girdi: GrupGirdisi,
): Promise<IslemSonucu> {
  const sonuc = grupSemasi.safeParse(girdi);
  if (!sonuc.success || !idSemasi.safeParse(grupId).success) {
    return { hata: "Form bilgileri geçersiz." };
  }

  const { supabase, kullanici } = await oturumGetir();
  const { ad, aciklama, renk, saatlikUcret } = sonuc.data;

  const { data, error } = await supabase
    .from("gruplar")
    .update({
      ad,
      aciklama: aciklama || null,
      renk,
      saatlik_ucret: tutarCozumle(saatlikUcret),
    })
    .eq("id", grupId)
    .eq("hoca_id", kullanici.id)
    .select("id");

  if (error || !data?.length) {
    return { hata: "Grup güncellenemedi. Lütfen tekrar deneyin." };
  }

  sayfalariYenile(grupId);
  return { basarili: true };
}

/**
 * Öğrenciye kişiye özel saatlik ücret atar; boş girdi özel ücreti kaldırır
 * (öğrenci yeniden grubun / varsayılan ücrete döner). Yalnızca sonraki
 * yoklamaları etkiler.
 */
export async function ogrenciUcretiAyarla(
  grupId: string,
  ogrenciId: string,
  girdi: OgrenciUcretiGirdisi,
): Promise<IslemSonucu> {
  const sonuc = ogrenciUcretiSemasi.safeParse(girdi);
  if (
    !sonuc.success ||
    !idSemasi.safeParse(grupId).success ||
    !idSemasi.safeParse(ogrenciId).success
  ) {
    return { hata: "Geçerli bir tutar girin ya da boş bırakın." };
  }

  const { supabase, kullanici } = await oturumGetir();

  const { data, error } = await supabase
    .from("ogrenciler")
    .update({ saatlik_ucret: tutarCozumle(sonuc.data.saatlikUcret) })
    .eq("id", ogrenciId)
    .eq("hoca_id", kullanici.id)
    .is("arsivlendi_at", null)
    .select("id");

  if (error || !data?.length) {
    return { hata: "Ücret kaydedilemedi. Lütfen tekrar deneyin." };
  }

  sayfalariYenile(grupId);
  revalidatePath(`/ogrenciler/${ogrenciId}`);
  return { basarili: true };
}

/**
 * Öğrenciyi gruba ekler. Öğrenci aynı anda yalnızca bir grupta
 * olabildiği için başka bir gruptaysa o gruptan bu gruba taşınır.
 */
export async function grubaOgrenciEkle(
  grupId: string,
  ogrenciId: string,
): Promise<IslemSonucu> {
  if (!idSemasi.safeParse(grupId).success || !idSemasi.safeParse(ogrenciId).success) {
    return { hata: "Geçersiz istek." };
  }

  const { supabase, kullanici } = await oturumGetir();

  const { data, error } = await supabase
    .from("ogrenciler")
    .update({ grup_id: grupId })
    .eq("id", ogrenciId)
    .eq("hoca_id", kullanici.id)
    .is("arsivlendi_at", null)
    .select("id");

  if (error || !data?.length) {
    return { hata: "Öğrenci gruba eklenemedi. Lütfen tekrar deneyin." };
  }

  sayfalariYenile(grupId);
  revalidatePath(`/ogrenciler/${ogrenciId}`);
  return { basarili: true };
}

/** Öğrenciyi grubundan çıkarır (öğrenci "grupsuz" kalır, silinmez). */
export async function gruptanCikar(
  grupId: string,
  ogrenciId: string,
): Promise<IslemSonucu> {
  if (!idSemasi.safeParse(grupId).success || !idSemasi.safeParse(ogrenciId).success) {
    return { hata: "Geçersiz istek." };
  }

  const { supabase, kullanici } = await oturumGetir();

  const { data, error } = await supabase
    .from("ogrenciler")
    .update({ grup_id: null })
    .eq("id", ogrenciId)
    .eq("grup_id", grupId)
    .eq("hoca_id", kullanici.id)
    .select("id");

  if (error || !data?.length) {
    return { hata: "Öğrenci gruptan çıkarılamadı. Lütfen tekrar deneyin." };
  }

  sayfalariYenile(grupId);
  revalidatePath(`/ogrenciler/${ogrenciId}`);
  return { basarili: true };
}
