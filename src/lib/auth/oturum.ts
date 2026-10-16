import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Oturum açmış kullanıcıyı ve profilini döner. Aynı istek içinde
 * (layout + sayfa) birden çok çağrıldığında tek sorgu yapılır.
 *
 * Profili olmayan veya pasifleştirilmiş kullanıcı /cikis'e yönlendirilir
 * (orada oturum kapatılıp /giris'e gönderilir).
 */
export const oturumGetir = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiller")
    .select("id, kullanici_adi, ad_soyad, rol, aktif")
    .eq("id", user.id)
    .maybeSingle();

  if (!profil || !profil.aktif) redirect("/cikis");

  return { supabase, kullanici: user, profil };
});
