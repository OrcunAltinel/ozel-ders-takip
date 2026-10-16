import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Server Component, Server Action ve Route Handler'larda kullanılacak
 * Supabase istemcisi. Oturum bilgisi cookie üzerinden okunur/yazılır.
 *
 * Kullanıcının giriş yaptığı oturumla çalışır; RLS politikaları
 * `auth.uid()` üzerinden bu istemcinin kimliğine göre uygulanır.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component render'ı sırasında çağrılırsa cookie yazılamaz.
            // Middleware oturum yenilemesini zaten üstlendiği için yoksayılabilir.
          }
        },
      },
    },
  );
}
