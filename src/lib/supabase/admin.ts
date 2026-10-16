import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service role anahtarıyla çalışan yönetici Supabase istemcisi.
 *
 * SADECE sunucu tarafında (server action / route handler) kullanılır:
 * - Kullanıcı oluşturma, şifre sıfırlama, aktif/pasif yapma (auth.admin.*)
 * - RLS'yi atlaması gereken yönetici işlemleri
 *
 * `server-only` paketi bu dosyanın yanlışlıkla bir client component'e
 * import edilmesini build aşamasında engeller. Her çağıran fonksiyon
 * kullanıcının gerçekten yetkili (yonetici) olduğunu kendi içinde
 * doğrulamak zorundadır; bu istemci RLS'yi tamamen atlar.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase servis rolü yapılandırması eksik: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenlerini kontrol edin.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
