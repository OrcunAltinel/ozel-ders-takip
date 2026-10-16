const TL_FORMATLAYICI = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

/** Sayıyı "1.250,00 ₺" biçiminde Türk Lirası olarak formatlar. */
export function paraFormatla(tutar: number): string {
  return TL_FORMATLAYICI.format(tutar);
}
