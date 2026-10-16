import "server-only";
import { oturumGetir } from "@/lib/auth/oturum";

export type OgrenciSecenegi = {
  id: string;
  adSoyad: string;
  bakiye: number;
  arsivde: boolean;
};

/**
 * Ödeme formundaki öğrenci listesi: tüm aktif öğrenciler + bakiyesi
 * sıfır olmayan arşivdeki öğrenciler (kalan borcunu ödeyebilsinler diye).
 */
export async function odemeOgrenciSecenekleri(): Promise<OgrenciSecenegi[]> {
  const { supabase, kullanici } = await oturumGetir();

  const [{ data: ogrenciler }, { data: bakiyeler }] = await Promise.all([
    supabase
      .from("ogrenciler")
      .select("id, ad_soyad, arsivlendi_at")
      .eq("hoca_id", kullanici.id)
      .order("ad_soyad"),
    supabase
      .from("ogrenci_bakiyeleri")
      .select("ogrenci_id, bakiye")
      .eq("hoca_id", kullanici.id),
  ]);

  const bakiyeHaritasi = new Map(
    (bakiyeler ?? []).map((b) => [b.ogrenci_id, b.bakiye ?? 0]),
  );

  return (ogrenciler ?? [])
    .map((o) => ({
      id: o.id,
      adSoyad: o.ad_soyad,
      bakiye: bakiyeHaritasi.get(o.id) ?? 0,
      arsivde: o.arsivlendi_at !== null,
    }))
    .filter((o) => !o.arsivde || o.bakiye !== 0);
}
