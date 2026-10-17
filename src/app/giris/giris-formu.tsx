"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { girisYap } from "@/actions/auth";
import { girisSemasi, type GirisGirdisi } from "@/lib/validasyon/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";

export function GirisFormu() {
  const [sunucuHatasi, setSunucuHatasi] = useState<string | null>(null);
  const [beklemede, baslatGecisi] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GirisGirdisi>({
    resolver: zodResolver(girisSemasi),
    defaultValues: { kullaniciAdi: "", sifre: "", beniHatirla: false },
  });

  function gonder(girdi: GirisGirdisi) {
    setSunucuHatasi(null);
    baslatGecisi(async () => {
      const sonuc = await girisYap(girdi);
      if (sonuc?.hata) {
        setSunucuHatasi(sonuc.hata);
        toast.error(sonuc.hata);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(gonder)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.kullaniciAdi}>
          <FieldLabel htmlFor="kullaniciAdi">Kullanıcı adı</FieldLabel>
          <Input
            id="kullaniciAdi"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            {...register("kullaniciAdi")}
          />
          <FieldError errors={[errors.kullaniciAdi]} />
        </Field>

        <Field data-invalid={!!errors.sifre}>
          <FieldLabel htmlFor="sifre">Şifre</FieldLabel>
          <Input
            id="sifre"
            type="password"
            autoComplete="current-password"
            {...register("sifre")}
          />
          <FieldError errors={[errors.sifre]} />
        </Field>

        <Controller
          control={control}
          name="beniHatirla"
          render={({ field }) => (
            <FieldLabel htmlFor="beniHatirla" className="flex-row items-center">
              <Checkbox
                id="beniHatirla"
                checked={field.value}
                onCheckedChange={(deger) => field.onChange(deger === true)}
              />
              Beni hatırla
            </FieldLabel>
          )}
        />

        {sunucuHatasi ? (
          <p role="alert" className="text-sm text-destructive">
            {sunucuHatasi}
          </p>
        ) : null}

        <Button type="submit" disabled={beklemede} className="w-full">
          {beklemede ? "Giriş yapılıyor…" : "Giriş Yap"}
        </Button>
      </FieldGroup>
    </form>
  );
}
