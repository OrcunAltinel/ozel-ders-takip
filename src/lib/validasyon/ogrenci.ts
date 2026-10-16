import { z } from "zod";
import { telefonNormallestir } from "@/lib/telefon";

const istegeBagliTelefon = z
  .string()
  .trim()
  .refine((deger) => !deger || telefonNormallestir(deger) !== null, {
    message: "Geçerli bir telefon numarası girin (örn. 0532 123 45 67).",
  });

export const ogrenciSemasi = z.object({
  adSoyad: z
    .string()
    .trim()
    .min(1, "Ad soyad gerekli.")
    .max(100, "Ad soyad en fazla 100 karakter olabilir."),
  telefon: istegeBagliTelefon,
  veliAd: z
    .string()
    .trim()
    .max(100, "Veli adı en fazla 100 karakter olabilir."),
  veliTelefon: istegeBagliTelefon,
  /** Boş string = grupsuz. */
  grupId: z.string(),
  notlar: z
    .string()
    .trim()
    .max(2000, "Notlar en fazla 2000 karakter olabilir."),
});

export type OgrenciGirdisi = z.input<typeof ogrenciSemasi>;
