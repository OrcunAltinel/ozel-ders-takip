import "server-only";
import { kimlikGetir } from "@/lib/auth/oturum";

/** Oturumdaki hocanın saatlik ücretini döner; henüz belirlenmemişse null. */
export async function saatlikUcretGetir(): Promise<number | null> {
  const { supabase, kullanici } = await kimlikGetir();

  const { data } = await supabase
    .from("hoca_ayarlari")
    .select("saatlik_ucret")
    .eq("hoca_id", kullanici.id)
    .maybeSingle();

  return data?.saatlik_ucret ?? null;
}
