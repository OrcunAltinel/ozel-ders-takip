"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { kullaniciAdindanEmailUret } from "@/lib/auth/kullanici-adi";
import { oturumGetir } from "@/lib/auth/oturum";
import type { IslemSonucu } from "@/lib/islem-sonucu";
import {
  sifreDegistirSemasi,
  type SifreDegistirGirdisi,
} from "@/lib/validasyon/hesap";

/**
 * Oturum açmış kullanıcının kendi şifresini değiştirir. Önce mevcut şifre,
 * aktif oturuma dokunmayan geçici bir istemciyle doğrulanır (omuz üstü /
 * sahipsiz oturum kötüye kullanımına karşı); ardından kullanıcının kendi
 * oturumuyla yeni şifre ayarlanır. Service role gerekmez.
 */
export async function sifreDegistir(
  girdi: SifreDegistirGirdisi,
): Promise<IslemSonucu> {
  const sonuc = sifreDegistirSemasi.safeParse(girdi);
  if (!sonuc.success) {
    return { hata: sonuc.error.issues[0]?.message ?? "Form bilgileri geçersiz." };
  }

  const { supabase, profil } = await oturumGetir();

  // Mevcut şifreyi, cookie'lere/oturuma dokunmayan geçici bir istemciyle doğrula.
  const dogrulayici = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error: dogrulamaHatasi } = await dogrulayici.auth.signInWithPassword({
    email: kullaniciAdindanEmailUret(profil.kullanici_adi),
    password: sonuc.data.mevcutSifre,
  });
  if (dogrulamaHatasi) return { hata: "Mevcut şifre hatalı." };

  const { error } = await supabase.auth.updateUser({
    password: sonuc.data.yeniSifre,
  });
  if (error) {
    return { hata: "Şifre değiştirilemedi. Lütfen tekrar deneyin." };
  }

  return { basarili: true };
}
