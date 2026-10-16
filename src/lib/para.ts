const TL_FORMATLAYICI = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

/** Sayıyı "1.250,00 ₺" biçiminde Türk Lirası olarak formatlar. */
export function paraFormatla(tutar: number): string {
  return TL_FORMATLAYICI.format(tutar);
}

/** "750", "750,50", "1.250,50" gibi Türkçe yazılmış tutarları sayıya çevirir. Geçersizse null döner. */
export function tutarCozumle(girdi: string): number | null {
  const temiz = girdi.trim().replace(/\s|₺/g, "");
  if (!temiz) return null;
  // Virgül varsa ondalık ayırıcıdır; noktalar binlik ayırıcıdır.
  const normal = temiz.includes(",")
    ? temiz.replace(/\./g, "").replace(",", ".")
    : temiz;
  if (!/^\d+(\.\d{1,2})?$/.test(normal)) return null;
  return Number(normal);
}

/** Tutarı form alanında düzenlenebilir biçimde yazar (750 → "750", 750.5 → "750,50"). */
export function tutariGirdiyeYaz(tutar: number): string {
  return Number.isInteger(tutar)
    ? String(tutar)
    : tutar.toFixed(2).replace(".", ",");
}
