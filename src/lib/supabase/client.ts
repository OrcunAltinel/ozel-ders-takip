import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Tarayıcıda (client component içinde) kullanılacak Supabase istemcisi.
 * Sadece NEXT_PUBLIC_* anahtarları kullanır, service role anahtarına erişimi yoktur.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
