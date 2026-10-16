/**
 * Supabase Auth e-posta zorunlu kıldığı için kullanıcı adlarını
 * sahte bir e-postaya çeviriyoruz. Kullanıcı bu e-postayı hiçbir
 * zaman görmez; sadece kullanıcı adı + şifre ile giriş yapar.
 */

const KULLANICI_ADI_REGEX = /^[a-z0-9._]+$/;
const SAHTE_EMAIL_ALAN_ADI = "ozelders.local";

/** Kullanıcı adını küçük harfe çevirir ve baştaki/sondaki boşlukları temizler. */
export function kullaniciAdiNormallestir(girdi: string): string {
  return girdi.trim().toLowerCase();
}

/** Yalnızca a-z, 0-9, "." ve "_" karakterlerine izin verir. */
export function kullaniciAdiGecerliMi(girdi: string): boolean {
  return KULLANICI_ADI_REGEX.test(girdi);
}

/** Kullanıcı adını Supabase Auth için sahte e-postaya çevirir (örn. "ahmet.hoca@ozelders.local"). */
export function kullaniciAdindanEmailUret(kullaniciAdi: string): string {
  return `${kullaniciAdiNormallestir(kullaniciAdi)}@${SAHTE_EMAIL_ALAN_ADI}`;
}
