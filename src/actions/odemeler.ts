"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { oturumGetir } from "@/lib/auth/oturum";
import type { IslemSonucu } from "@/lib/islem-sonucu";
import { tutarCozumle } from "@/lib/para";
import { odemeSemasi, type OdemeGirdisi } from "@/lib/validasyon/odeme";
import { bugununTarihi } from "@/lib/zaman/istanbul";

const idSemasi = z.uuid();

type DogrulamaSonucu =
  { hata: string } | { veri: z.output<typeof odemeSemasi>; tutar: number };

function dogrula(girdi: OdemeGirdisi): DogrulamaSonucu {
  const sonuc = odemeSemasi.safeParse(girdi);
  if (!sonuc.success || !idSemasi.safeParse(sonuc.data.ogrenciId).success) {
    return { hata: "Form bilgileri geçersiz." };
  }
  if (sonuc.data.tarih > bugununTarihi()) {
    return { hata: "Ödeme tarihi ileri bir tarih olamaz." };
  }
  return { veri: sonuc.data, tutar: tutarCozumle(sonuc.data.tutar)! };
}

function sayfalariYenile(ogrenciId: string) {
  revalidatePath("/", "layout");
  revalidatePath(`/ogrenciler/${ogrenciId}`);
}

export async function odemeEkle(girdi: OdemeGirdisi): Promise<IslemSonucu> {
  const d = dogrula(girdi);
  if ("hata" in d) return d;

  const { supabase, kullanici } = await oturumGetir();

  // Arşivdeki öğrenciden de (kalan borcunu kapatması için) ödeme alınabilir.
  const { data: ogrenci } = await supabase
    .from("ogrenciler")
    .select("id")
    .eq("id", d.veri.ogrenciId)
    .eq("hoca_id", kullanici.id)
    .maybeSingle();
  if (!ogrenci) return { hata: "Öğrenci bulunamadı." };

  const { error } = await supabase.from("odemeler").insert({
    hoca_id: kullanici.id,
    ogrenci_id: d.veri.ogrenciId,
    tutar: d.tutar,
    tarih: d.veri.tarih,
    odeme_yontemi: d.veri.odemeYontemi,
    aciklama: d.veri.aciklama || null,
  });

  if (error) return { hata: "Ödeme kaydedilemedi. Lütfen tekrar deneyin." };

  sayfalariYenile(d.veri.ogrenciId);
  return { basarili: true };
}

export async function odemeGuncelle(
  odemeId: string,
  girdi: OdemeGirdisi,
): Promise<IslemSonucu> {
  if (!idSemasi.safeParse(odemeId).success) return { hata: "Geçersiz istek." };
  const d = dogrula(girdi);
  if ("hata" in d) return d;

  const { supabase, kullanici } = await oturumGetir();

  const { data: eski } = await supabase
    .from("odemeler")
    .select("ogrenci_id")
    .eq("id", odemeId)
    .eq("hoca_id", kullanici.id)
    .maybeSingle();
  if (!eski) return { hata: "Ödeme bulunamadı." };

  const { error } = await supabase
    .from("odemeler")
    .update({
      ogrenci_id: d.veri.ogrenciId,
      tutar: d.tutar,
      tarih: d.veri.tarih,
      odeme_yontemi: d.veri.odemeYontemi,
      aciklama: d.veri.aciklama || null,
    })
    .eq("id", odemeId)
    .eq("hoca_id", kullanici.id);

  if (error) return { hata: "Ödeme güncellenemedi. Lütfen tekrar deneyin." };

  sayfalariYenile(d.veri.ogrenciId);
  if (eski.ogrenci_id !== d.veri.ogrenciId) sayfalariYenile(eski.ogrenci_id);
  return { basarili: true };
}

/** Yanlış girilen bir ödemeyi siler; öğrencinin borcu buna göre artar. */
export async function odemeSil(odemeId: string): Promise<IslemSonucu> {
  if (!idSemasi.safeParse(odemeId).success) return { hata: "Geçersiz istek." };

  const { supabase, kullanici } = await oturumGetir();

  const { data, error } = await supabase
    .from("odemeler")
    .delete()
    .eq("id", odemeId)
    .eq("hoca_id", kullanici.id)
    .select("ogrenci_id");

  if (error || !data?.length) {
    return { hata: "Ödeme silinemedi. Lütfen tekrar deneyin." };
  }

  sayfalariYenile(data[0].ogrenci_id);
  return { basarili: true };
}
