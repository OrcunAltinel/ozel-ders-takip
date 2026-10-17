import { z } from "zod";

export const sifreDegistirSemasi = z
  .object({
    mevcutSifre: z.string().min(1, "Mevcut şifre gerekli."),
    yeniSifre: z.string().min(8, "Yeni şifre en az 8 karakter olmalı."),
    yeniSifreTekrar: z.string().min(1, "Yeni şifreyi tekrar girin."),
  })
  .refine((d) => d.yeniSifre === d.yeniSifreTekrar, {
    message: "Yeni şifreler eşleşmiyor.",
    path: ["yeniSifreTekrar"],
  });

export type SifreDegistirGirdisi = z.input<typeof sifreDegistirSemasi>;
