import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Her istekte Supabase oturumunu (gerekirse) yeniler ve
 * giriş yapmamış kullanıcıyı /giris'e, giriş yapmış kullanıcıyı
 * /giris'ten ana sayfaya yönlendirir.
 */
export async function oturumuGuncelle(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Not: getSession() değil getClaims() kullanılır. getClaims() JWT'nin
  // imzasını Supabase'in asimetrik anahtarlarıyla (JWKS önbelleğe alınır)
  // yerel olarak doğrular; sahte/eski cookie'lere güvenmez ama getUser()
  // gibi her istekte Auth sunucusuna gitmez. Süresi dolmuş token'ı da
  // gerektiğinde yeniler (cookie'ler setAll ile yanıta yazılır).
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims.sub ?? null;

  const girisSayfasindaMi = request.nextUrl.pathname.startsWith("/giris");

  if (!user && !girisSayfasindaMi) {
    const yonlendirmeUrl = request.nextUrl.clone();
    yonlendirmeUrl.pathname = "/giris";
    return NextResponse.redirect(yonlendirmeUrl);
  }

  if (user && girisSayfasindaMi) {
    const yonlendirmeUrl = request.nextUrl.clone();
    yonlendirmeUrl.pathname = "/";
    return NextResponse.redirect(yonlendirmeUrl);
  }

  return response;
}
