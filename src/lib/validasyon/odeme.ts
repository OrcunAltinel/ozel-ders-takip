import { z } from "zod";
import { tutarCozumle } from "@/lib/para";
import { tarihSemasi } from "@/lib/validasyon/ders";

export const ODEME_YONTEMLERI = {
  nakit: "Nakit",
  havale: "Havale / EFT",
  diger: "Diğer",
} as const;

export type OdemeYontemi = keyof typeof ODEME_YONTEMLERI;

export const odemeSemasi = z.object({
  ogrenciId: z.string().min(1, "Öğrenci seçin."),
  tutar: z
    .string()
    .trim()
    .min(1, "Tutar gerekli.")
    .refine((deger) => (tutarCozumle(deger) ?? 0) > 0, {
      message:
        "Sıfırdan büyük geçerli bir tutar girin (örn. 1500 veya 1.500,50).",
    }),
  tarih: tarihSemasi,
  odemeYontemi: z.enum(["nakit", "havale", "diger"]),
  aciklama: z
    .string()
    .trim()
    .max(300, "Açıklama en fazla 300 karakter olabilir."),
});

export type OdemeGirdisi = z.input<typeof odemeSemasi>;
