import { z } from "zod";

export const girisSemasi = z.object({
  kullaniciAdi: z
    .string()
    .trim()
    .min(1, "Kullanıcı adı gerekli.")
    .transform((deger) => deger.toLowerCase()),
  sifre: z.string().min(1, "Şifre gerekli."),
  beniHatirla: z.boolean(),
});

export type GirisGirdisi = z.input<typeof girisSemasi>;
