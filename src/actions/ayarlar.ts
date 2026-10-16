"use server";

import { revalidatePath } from "next/cache";
import { oturumGetir } from "@/lib/auth/oturum";
import type { IslemSonucu } from "@/lib/islem-sonucu";
import { tutarCozumle } from "@/lib/para";
import {
  dersUcretiSemasi,
  type DersUcretiGirdisi,
} from "@/lib/validasyon/ayarlar";

/**
 * Hocanın tüm öğrencileri için geçerli ders başı ücreti kaydeder.
 * Değişiklik yalnızca bundan sonra alınacak yoklamalara yansır; geçmiş
 * yoklamaların ücreti veritabanı tetikleyicisi sayesinde korunur.
 */
export async function dersUcretiKaydet(
  girdi: DersUcretiGirdisi,
): Promise<IslemSonucu> {
  const sonuc = dersUcretiSemasi.safeParse(girdi);
  if (!sonuc.success) return { hata: "Geçerli bir tutar girin." };

  const { supabase, kullanici } = await oturumGetir();

  const { error } = await supabase.from("hoca_ayarlari").upsert({
    hoca_id: kullanici.id,
    ders_ucreti: tutarCozumle(sonuc.data.dersUcreti)!,
    updated_at: new Date().toISOString(),
  });

  if (error) return { hata: "Ders ücreti kaydedilemedi. Lütfen tekrar deneyin." };

  revalidatePath("/", "layout");
  return { basarili: true };
}
