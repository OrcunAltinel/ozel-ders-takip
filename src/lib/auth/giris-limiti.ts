import "server-only";

/**
 * Giriş denemeleri için basit, bellek-içi (in-memory) hız sınırlayıcı.
 * Kaba kuvvet (brute force) şifre denemelerini yavaşlatır.
 *
 * SINIRLAMA: Durum süreç belleğinde tutulur. Vercel gibi birden çok
 * sunucu örneğinin (veya soğuk başlatmaların) olduğu ortamlarda sayaç
 * örnekler arasında paylaşılmaz; bu yüzden "en iyi çaba" (best-effort)
 * bir korumadır ve Supabase Auth'un kendi hız limitlerine EK olarak çalışır.
 * Tek hocalı bu uygulama için yeterlidir; ileride çok örnekli sıkı bir
 * koruma gerekirse Upstash/Redis veya veritabanı tabanlı bir sayaca geçilir.
 */

const MAX_DENEME = 5;
const PENCERE_MS = 15 * 60 * 1000; // 15 dakika

type Kayit = { adet: number; ilkDeneme: number };

const denemeler = new Map<string, Kayit>();

/** Süresi dolmuş kayıtları temizler (Map'in sınırsız büyümesini önler). */
function suresiDolanlariTemizle(simdi: number) {
  for (const [anahtar, kayit] of denemeler) {
    if (simdi - kayit.ilkDeneme >= PENCERE_MS) denemeler.delete(anahtar);
  }
}

/**
 * Anahtar (ör. istemci IP'si) için giriş denemesine izin verilip
 * verilmediğini döner. Engelliyse kalan bekleme süresini (saniye) verir.
 */
export function girisDenemesiKontrol(
  anahtar: string,
): { izinli: true } | { izinli: false; kalanSaniye: number } {
  const simdi = Date.now();
  const kayit = denemeler.get(anahtar);

  if (!kayit || simdi - kayit.ilkDeneme >= PENCERE_MS) {
    return { izinli: true };
  }
  if (kayit.adet < MAX_DENEME) {
    return { izinli: true };
  }
  const kalanSaniye = Math.ceil((PENCERE_MS - (simdi - kayit.ilkDeneme)) / 1000);
  return { izinli: false, kalanSaniye };
}

/** Başarısız bir giriş denemesini kaydeder. */
export function basarisizDenemeKaydet(anahtar: string) {
  const simdi = Date.now();
  suresiDolanlariTemizle(simdi);

  const kayit = denemeler.get(anahtar);
  if (!kayit || simdi - kayit.ilkDeneme >= PENCERE_MS) {
    denemeler.set(anahtar, { adet: 1, ilkDeneme: simdi });
    return;
  }
  kayit.adet += 1;
}

/** Başarılı girişten sonra anahtarın sayacını sıfırlar. */
export function denemeleriSifirla(anahtar: string) {
  denemeler.delete(anahtar);
}
