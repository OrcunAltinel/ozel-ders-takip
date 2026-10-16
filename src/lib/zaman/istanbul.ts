import { tr } from "date-fns/locale";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

/**
 * Uygulamanın tüm tarih/saat hesaplamaları bu saat dilimine göre yapılır.
 * "Bugün" her zaman Europe/Istanbul'a göredir, sunucunun veya tarayıcının
 * yerel saat dilimine göre değil.
 */
export const ISTANBUL_SAAT_DILIMI = "Europe/Istanbul";

/** Şu anı Europe/Istanbul saat dilimine göre bir Date nesnesi olarak döndürür. */
export function suAnIstanbul(): Date {
  return toZonedTime(new Date(), ISTANBUL_SAAT_DILIMI);
}

/** Bugünün tarihini Europe/Istanbul saat dilimine göre "yyyy-MM-dd" olarak döndürür (DB sorguları için). */
export function bugununTarihi(): string {
  return formatInTimeZone(new Date(), ISTANBUL_SAAT_DILIMI, "yyyy-MM-dd");
}

/** "16 Ekim 2026, Cuma" biçiminde Türkçe tam tarih formatlar. */
export function tarihFormatla(tarih: Date | string): string {
  const deger = typeof tarih === "string" ? new Date(tarih) : tarih;
  return formatInTimeZone(deger, ISTANBUL_SAAT_DILIMI, "d MMMM yyyy, EEEE", {
    locale: tr,
  });
}

/** "16 Eki 2026" gibi kısa tarih formatlar (tablo/liste görünümleri için). */
export function kisaTarihFormatla(tarih: Date | string): string {
  const deger = typeof tarih === "string" ? new Date(tarih) : tarih;
  return formatInTimeZone(deger, ISTANBUL_SAAT_DILIMI, "d MMM yyyy", {
    locale: tr,
  });
}

/** "16:30" biçiminde 24 saatlik saat formatlar. */
export function saatFormatla(tarih: Date | string): string {
  const deger = typeof tarih === "string" ? new Date(tarih) : tarih;
  return formatInTimeZone(deger, ISTANBUL_SAAT_DILIMI, "HH:mm");
}

/** ISO haftanın günü: 1 = Pazartesi ... 7 = Pazar (Europe/Istanbul'a göre). */
export function haftaninGunu(tarih: Date | string): number {
  const deger = typeof tarih === "string" ? new Date(tarih) : tarih;
  return Number(formatInTimeZone(deger, ISTANBUL_SAAT_DILIMI, "i"));
}

const HAFTA_GUNLERI = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

/** 1-7 arası ISO gün numarasını Türkçe gün adına çevirir. */
export function haftaninGunuAdi(gun: number): string {
  return HAFTA_GUNLERI[gun - 1] ?? "";
}
