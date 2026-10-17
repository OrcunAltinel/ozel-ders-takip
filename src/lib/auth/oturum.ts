import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Oturum açmış kullanıcının kimliğini döner. JWT, Supabase'in asimetrik
 * imza anahtarlarıyla (JWKS önbelleğe alınır) YEREL olarak doğrulanır;
 * getUser()'ın aksine her çağrıda Auth sunucusuna gidilmez (~150 ms kazanç).
 *
 * Sayfalardaki salt okuma sorguları için yeterlidir: veriye erişim zaten
 * RLS ile `auth.uid()` üzerinden sınırlanır. Aynı istek içinde birden çok
 * çağrıldığında tek kez çalışır.
 */
export const kimlikGetir = cache(async () => {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const id = data?.claims.sub;
  if (!id) redirect("/giris");

  return { supabase, kullanici: { id } };
});

/**
 * Kimliğe ek olarak profili de yükler. Profili olmayan veya pasifleştirilmiş
 * kullanıcı /cikis'e yönlendirilir (orada oturum kapatılıp /giris'e
 * gönderilir). Uygulama yerleşimi, yönetici kontrolleri ve veri değiştiren
 * server action'lar bunu kullanır.
 */
export const oturumGetir = cache(async () => {
  const { supabase, kullanici } = await kimlikGetir();

  const { data: profil } = await supabase
    .from("profiller")
    .select("id, kullanici_adi, ad_soyad, rol, aktif")
    .eq("id", kullanici.id)
    .maybeSingle();

  if (!profil || !profil.aktif) redirect("/cikis");

  return { supabase, kullanici, profil };
});
