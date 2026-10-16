import { z } from "zod";

export const GRUP_RENKLERI = [
  "#2563eb", // mavi
  "#16a34a", // yeşil
  "#dc2626", // kırmızı
  "#d97706", // turuncu
  "#9333ea", // mor
  "#0891b2", // camgöbeği
  "#db2777", // pembe
  "#4b5563", // gri
] as const;

export const grupSemasi = z.object({
  ad: z
    .string()
    .trim()
    .min(1, "Grup adı gerekli.")
    .max(100, "Grup adı en fazla 100 karakter olabilir."),
  aciklama: z
    .string()
    .trim()
    .max(500, "Açıklama en fazla 500 karakter olabilir."),
  renk: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Geçerli bir renk seçin."),
});

export type GrupGirdisi = z.input<typeof grupSemasi>;
