import { z } from "zod";
import { tutarCozumle } from "@/lib/para";

export const dersUcretiSemasi = z.object({
  dersUcreti: z
    .string()
    .trim()
    .min(1, "Ders ücreti gerekli.")
    .refine((deger) => tutarCozumle(deger) !== null, {
      message: "Geçerli bir tutar girin (örn. 750 veya 750,50).",
    }),
});

export type DersUcretiGirdisi = z.input<typeof dersUcretiSemasi>;
