"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { oturumGetir } from "@/lib/auth/oturum";
import type { IslemSonucu } from "@/lib/islem-sonucu";
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
  const { ad, aciklama, renk } = sonuc.data;

  const { error } = await supabase.from("gruplar").insert({
    hoca_id: kullanici.id,
    ad,
    aciklama: aciklama || null,
    renk,
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
  const { ad, aciklama, renk } = sonuc.data;

  const { data, error } = await supabase
    .from("gruplar")
    .update({ ad, aciklama: aciklama || null, renk })
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
