"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { kullaniciAdindanEmailUret } from "@/lib/auth/kullanici-adi";
import type { Database } from "@/types/database.types";
import { girisSemasi, type GirisGirdisi } from "@/lib/validasyon/auth";
import { createClient } from "@/lib/supabase/server";

type GirisSonucu = { hata: string } | void;

/**
 * Kullanıcı adı + şifre ile giriş yapar.
 *
 * "Beni hatırla" işaretli değilse, Supabase'in normalde kalıcı (maxAge'li)
 * olarak ayarladığı oturum cookie'leri burada oturum cookie'sine
 * (maxAge/expires olmadan) çevrilir; tarayıcı kapanınca oturum düşer.
 */
export async function girisYap(girdi: GirisGirdisi): Promise<GirisSonucu> {
  const sonuc = girisSemasi.safeParse(girdi);
  if (!sonuc.success) {
    return { hata: "Kullanıcı adı veya şifre hatalı." };
  }

  const { kullaniciAdi, sifre, beniHatirla } = sonuc.data;
  const email = kullaniciAdindanEmailUret(kullaniciAdi);

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const nihaiSecenekler = beniHatirla
              ? options
              : { ...options, maxAge: undefined, expires: undefined };
            cookieStore.set(name, value, nihaiSecenekler);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: sifre,
  });

  if (error) {
    // Pasif (yasaklı) hesaplar için de aynı genel mesaj verilir: Supabase
    // "user_banned" hatasını şifre YANLIŞ olsa bile döndürdüğü için ayrı bir
    // mesaj, şifreyi bilmeyen birine hesabın varlığını sızdırırdı.
    return { hata: "Kullanıcı adı veya şifre hatalı." };
  }

  redirect("/");
}

export async function cikisYap(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/giris");
}
