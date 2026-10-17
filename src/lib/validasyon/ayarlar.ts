import { z } from "zod";
import { tutarCozumle } from "@/lib/para";

export const saatlikUcretSemasi = z.object({
  saatlikUcret: z
    .string()
    .trim()
    .min(1, "Saatlik ücret gerekli.")
    .refine((deger) => tutarCozumle(deger) !== null, {
      message: "Geçerli bir tutar girin (örn. 300 veya 300,50).",
    }),
});

export type SaatlikUcretGirdisi = z.input<typeof saatlikUcretSemasi>;
