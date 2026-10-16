import { z } from "zod";
import { isValid, parseISO } from "date-fns";

export const tarihSemasi = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin.")
  .refine((deger) => isValid(parseISO(deger)), "Geçerli bir tarih girin.");

/** Boş string (= belirtilmedi) veya geçerli tarih. */
const istegeBagliTarih = z
  .string()
  .refine(
    (deger) => deger === "" || tarihSemasi.safeParse(deger).success,
    "Geçerli bir tarih girin.",
  );

export const saatSemasi = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Geçerli bir saat girin (SS:DD).");

const konuSemasi = z
  .string()
  .trim()
  .max(200, "Konu en fazla 200 karakter olabilir.");

const SAAT_SIRASI_HATASI = {
  message: "Bitiş saati başlangıç saatinden sonra olmalı.",
  path: ["bitisSaati"],
};

/** Takvimden yeni ders (tek seferlik veya haftalık tekrarlayan) oluşturma formu. */
export const dersOlusturSemasi = z
  .object({
    grupId: z.string().min(1, "Grup seçin."),
    tarih: tarihSemasi,
    baslangicSaati: saatSemasi,
    bitisSaati: saatSemasi,
    konu: konuSemasi,
    tekrarla: z.boolean(),
    tekrarBitisTarihi: istegeBagliTarih,
  })
  .refine((d) => d.bitisSaati > d.baslangicSaati, SAAT_SIRASI_HATASI)
  .refine(
    (d) => !d.tekrarla || !d.tekrarBitisTarihi || d.tekrarBitisTarihi >= d.tarih,
    {
      message: "Tekrar bitiş tarihi, ilk ders tarihinden önce olamaz.",
      path: ["tekrarBitisTarihi"],
    },
  );

export type DersOlusturGirdisi = z.input<typeof dersOlusturSemasi>;

/** Var olan tek bir dersin tarih/saat/konusunu düzenleme formu. */
export const dersDuzenleSemasi = z
  .object({
    tarih: tarihSemasi,
    baslangicSaati: saatSemasi,
    bitisSaati: saatSemasi,
    konu: konuSemasi,
  })
  .refine((d) => d.bitisSaati > d.baslangicSaati, SAAT_SIRASI_HATASI);

export type DersDuzenleGirdisi = z.input<typeof dersDuzenleSemasi>;

/** Grubun haftalık tekrarlayan ders programı formu. */
export const programSemasi = z
  .object({
    haftaninGunu: z.number().int().min(1).max(7),
    baslangicSaati: saatSemasi,
    bitisSaati: saatSemasi,
    baslangicTarihi: tarihSemasi,
    bitisTarihi: istegeBagliTarih,
  })
  .refine((d) => d.bitisSaati > d.baslangicSaati, SAAT_SIRASI_HATASI)
  .refine((d) => !d.bitisTarihi || d.bitisTarihi >= d.baslangicTarihi, {
    message: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
    path: ["bitisTarihi"],
  });

export type ProgramGirdisi = z.input<typeof programSemasi>;
