"use server";

import { revalidatePath } from "next/cache";
import { oturumGetir } from "@/lib/auth/oturum";
import type { IslemSonucu } from "@/lib/islem-sonucu";
import { tutarCozumle } from "@/lib/para";
import {
  saatlikUcretSemasi,
  type SaatlikUcretGirdisi,
} from "@/lib/validasyon/ayarlar";

/**
 * Hocanın tüm öğrencileri için geçerli saatlik ücreti kaydeder. Bir yoklamanın
 * tutarı = saatlik ücret × dersin süresi (saat) olarak hesaplanır. Değişiklik
 * yalnızca bundan sonra alınacak yoklamalara yansır; geçmiş yoklamaların ücreti
 * veritabanı tetikleyicisi sayesinde korunur.
 */
export async function saatlikUcretKaydet(
  girdi: SaatlikUcretGirdisi,
): Promise<IslemSonucu> {
  const sonuc = saatlikUcretSemasi.safeParse(girdi);
  if (!sonuc.success) return { hata: "Geçerli bir tutar girin." };

  const { supabase, kullanici } = await oturumGetir();

  const { error } = await supabase.from("hoca_ayarlari").upsert({
    hoca_id: kullanici.id,
    saatlik_ucret: tutarCozumle(sonuc.data.saatlikUcret)!,
    updated_at: new Date().toISOString(),
  });

  if (error)
    return { hata: "Saatlik ücret kaydedilemedi. Lütfen tekrar deneyin." };

  revalidatePath("/", "layout");
  return { basarili: true };
}
