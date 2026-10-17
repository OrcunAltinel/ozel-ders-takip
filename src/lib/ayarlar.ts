import "server-only";
import { kimlikGetir } from "@/lib/auth/oturum";

/** Oturumdaki hocanın ders başı ücretini döner; henüz belirlenmemişse null. */
export async function dersUcretiGetir(): Promise<number | null> {
  const { supabase, kullanici } = await kimlikGetir();

  const { data } = await supabase
    .from("hoca_ayarlari")
    .select("ders_ucreti")
    .eq("hoca_id", kullanici.id)
    .maybeSingle();

  return data?.ders_ucreti ?? null;
}
