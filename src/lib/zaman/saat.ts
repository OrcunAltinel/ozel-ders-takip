import { addDays, format, getISODay, parseISO } from "date-fns";

/** Veritabanından gelen "16:00:00" değerini "16:00" yapar. */
export function saatKisalt(saat: string): string {
  return saat.slice(0, 5);
}

/** "16:00" saatine dakika ekler; gün sınırını aşarsa "23:59"da durur. */
export function saateDakikaEkle(saat: string, dakika: number): string {
  const [s, d] = saat.split(":").map(Number);
  const toplam = Math.min(s * 60 + d + dakika, 23 * 60 + 59);
  return `${String(Math.floor(toplam / 60)).padStart(2, "0")}:${String(toplam % 60).padStart(2, "0")}`;
}

/** "yyyy-MM-dd" tarihine gün ekler (saat diliminden bağımsız, takvim günü olarak). */
export function tariheGunEkle(tarih: string, gun: number): string {
  return format(addDays(parseISO(tarih), gun), "yyyy-MM-dd");
}

/** "yyyy-MM-dd" tarihinin ISO haftanın gününü döner (1 = Pazartesi ... 7 = Pazar). */
export function tarihinHaftaGunu(tarih: string): number {
  return getISODay(parseISO(tarih));
}
