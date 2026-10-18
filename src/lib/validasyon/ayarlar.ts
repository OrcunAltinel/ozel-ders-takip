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

/** Grup veya öğrenci için isteğe bağlı saatlik ücret; boş bırakılırsa üst
 *  seviyedeki (grup / varsayılan) ücret kullanılır. */
export const istegeBagliUcretSemasi = z
  .string()
  .trim()
  .refine((deger) => deger === "" || tutarCozumle(deger) !== null, {
    message: "Geçerli bir tutar girin (örn. 300 veya 300,50) ya da boş bırakın.",
  });

export const ogrenciUcretiSemasi = z.object({
  saatlikUcret: istegeBagliUcretSemasi,
});

export type OgrenciUcretiGirdisi = z.input<typeof ogrenciUcretiSemasi>;
