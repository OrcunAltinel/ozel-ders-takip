import { z } from "zod";

const sifreSemasi = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı.")
  .max(72, "Şifre en fazla 72 karakter olabilir.");

const adSoyadSemasi = z
  .string()
  .trim()
  .min(1, "Ad soyad gerekli.")
  .max(100, "Ad soyad en fazla 100 karakter olabilir.");

export const ROLLER = { hoca: "Hoca", yonetici: "Yönetici" } as const;
export type Rol = keyof typeof ROLLER;

const rolSemasi = z.enum(["hoca", "yonetici"]);

export const kullaniciOlusturSemasi = z.object({
  kullaniciAdi: z
    .string()
    .trim()
    .transform((deger) => deger.toLowerCase())
    .pipe(
      z
        .string()
        .min(3, "Kullanıcı adı en az 3 karakter olmalı.")
        .max(30, "Kullanıcı adı en fazla 30 karakter olabilir.")
        .regex(
          /^[a-z0-9._]+$/,
          "Yalnızca küçük harf (Türkçe karakter olmadan), rakam, nokta ve alt çizgi kullanın.",
        ),
    ),
  adSoyad: adSoyadSemasi,
  sifre: sifreSemasi,
  rol: rolSemasi,
});

export type KullaniciOlusturGirdisi = z.input<typeof kullaniciOlusturSemasi>;

export const sifreSifirlaSemasi = z.object({ sifre: sifreSemasi });
export type SifreSifirlaGirdisi = z.input<typeof sifreSifirlaSemasi>;

export const profilDuzenleSemasi = z.object({
  adSoyad: adSoyadSemasi,
  rol: rolSemasi,
});
export type ProfilDuzenleGirdisi = z.input<typeof profilDuzenleSemasi>;
