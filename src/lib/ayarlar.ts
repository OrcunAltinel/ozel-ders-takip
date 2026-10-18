import "server-only";
import { cache } from "react";
import { kimlikGetir } from "@/lib/auth/oturum";

/**
 * Oturumdaki hocanın varsayılan saatlik ücretini döner; henüz belirlenmemişse
 * null. Grup veya öğrenciye özel ücret yoksa bu ücret uygulanır.
 */
export const saatlikUcretGetir = cache(async (): Promise<number | null> => {
  const { supabase, kullanici } = await kimlikGetir();

  const { data } = await supabase
    .from("hoca_ayarlari")
    .select("saatlik_ucret")
    .eq("hoca_id", kullanici.id)
    .maybeSingle();

  return data?.saatlik_ucret ?? null;
});
