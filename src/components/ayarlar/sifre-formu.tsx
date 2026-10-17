"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { sifreDegistir } from "@/actions/hesap";
import {
  sifreDegistirSemasi,
  type SifreDegistirGirdisi,
} from "@/lib/validasyon/hesap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

export function SifreFormu() {
  const [beklemede, baslatGecisi] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SifreDegistirGirdisi>({
    resolver: zodResolver(sifreDegistirSemasi),
    defaultValues: { mevcutSifre: "", yeniSifre: "", yeniSifreTekrar: "" },
  });

  function gonder(girdi: SifreDegistirGirdisi) {
    baslatGecisi(async () => {
      const sonuc = await sifreDegistir(girdi);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success("Şifreniz değiştirildi.");
      reset({ mevcutSifre: "", yeniSifre: "", yeniSifreTekrar: "" });
    });
  }

  return (
    <form onSubmit={handleSubmit(gonder)} noValidate className="max-w-sm">
      <FieldGroup>
        <Field data-invalid={!!errors.mevcutSifre}>
          <FieldLabel htmlFor="mevcut-sifre">Mevcut şifre</FieldLabel>
          <Input
            id="mevcut-sifre"
            type="password"
            autoComplete="current-password"
            {...register("mevcutSifre")}
          />
          <FieldError errors={[errors.mevcutSifre]} />
        </Field>

        <Field data-invalid={!!errors.yeniSifre}>
          <FieldLabel htmlFor="yeni-sifre">Yeni şifre</FieldLabel>
          <Input
            id="yeni-sifre"
            type="password"
            autoComplete="new-password"
            {...register("yeniSifre")}
          />
          <FieldError errors={[errors.yeniSifre]} />
        </Field>

        <Field data-invalid={!!errors.yeniSifreTekrar}>
          <FieldLabel htmlFor="yeni-sifre-tekrar">Yeni şifre (tekrar)</FieldLabel>
          <Input
            id="yeni-sifre-tekrar"
            type="password"
            autoComplete="new-password"
            {...register("yeniSifreTekrar")}
          />
          <FieldError errors={[errors.yeniSifreTekrar]} />
        </Field>

        <div>
          <Button type="submit" disabled={beklemede}>
            {beklemede ? "Değiştiriliyor…" : "Şifreyi değiştir"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
