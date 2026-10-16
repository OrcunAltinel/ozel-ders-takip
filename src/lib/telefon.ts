/**
 * Türkiye telefon numaraları için doğrulama ve biçimlendirme yardımcıları.
 *
 * Numaralar veritabanında başında "0" olmadan 10 haneli, düz rakam
 * dizisi olarak saklanır (örn. "5321234567"). Gösterirken
 * `telefonFormatla` ile "0532 123 45 67" biçimine çevrilir.
 */

const GECERLI_ILK_HANE = new Set(["2", "3", "4", "5"]);

/**
 * Serbest biçimli bir girdiyi (boşluklu, "+90"lı, başında "0"lı vb.)
 * 10 haneli standart forma çevirir. Geçersizse null döner.
 */
export function telefonNormallestir(girdi: string): string | null {
  if (!girdi) return null;

  let rakamlar = girdi.replace(/\D/g, "");

  if (rakamlar.startsWith("0090")) {
    rakamlar = rakamlar.slice(4);
  } else if (rakamlar.startsWith("90") && rakamlar.length === 12) {
    rakamlar = rakamlar.slice(2);
  }

  if (rakamlar.length === 11 && rakamlar.startsWith("0")) {
    rakamlar = rakamlar.slice(1);
  }

  if (rakamlar.length !== 10) return null;
  if (!GECERLI_ILK_HANE.has(rakamlar[0])) return null;

  return rakamlar;
}

/** Girdinin geçerli bir Türkiye telefon numarasına dönüştürülebilir olup olmadığını kontrol eder. */
export function telefonGecerliMi(girdi: string): boolean {
  return telefonNormallestir(girdi) !== null;
}

/** Normalleştirilmiş (veya serbest biçimli) bir numarayı "0532 123 45 67" biçiminde gösterir. */
export function telefonFormatla(girdi: string): string {
  const normal = telefonNormallestir(girdi);
  if (!normal) return girdi;

  const eslesme = normal.match(/^(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (!eslesme) return girdi;

  const [, a, b, c, d] = eslesme;
  return `0${a} ${b} ${c} ${d}`;
}
