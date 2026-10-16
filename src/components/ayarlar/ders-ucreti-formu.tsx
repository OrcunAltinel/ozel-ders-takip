"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { dersUcretiKaydet } from "@/actions/ayarlar";
import { tutariGirdiyeYaz } from "@/lib/para";
import {
  dersUcretiSemasi,
  type DersUcretiGirdisi,
} from "@/lib/validasyon/ayarlar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

export function DersUcretiFormu({ mevcutUcret }: { mevcutUcret: number | null }) {
  const [beklemede, baslatGecisi] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<DersUcretiGirdisi>({
    resolver: zodResolver(dersUcretiSemasi),
    defaultValues: {
      dersUcreti: mevcutUcret === null ? "" : tutariGirdiyeYaz(mevcutUcret),
    },
  });

  function gonder(girdi: DersUcretiGirdisi) {
    baslatGecisi(async () => {
      const sonuc = await dersUcretiKaydet(girdi);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success("Ders ücreti kaydedildi.");
      reset(girdi);
    });
  }

  return (
    <form onSubmit={handleSubmit(gonder)} noValidate className="max-w-sm">
      <FieldGroup>
        <Field data-invalid={!!errors.dersUcreti}>
          <FieldLabel htmlFor="ders-ucreti">Ders başı ücret (₺)</FieldLabel>
          <Input
            id="ders-ucreti"
            inputMode="decimal"
            placeholder="örn. 750"
            {...register("dersUcreti")}
          />
          <FieldDescription>
            Tüm öğrenciler için geçerlidir. Ücreti değiştirirseniz yeni ücret
            yalnızca bundan sonra alınacak yoklamalara uygulanır; geçmiş
            dersler eski ücretle kalır.
          </FieldDescription>
          <FieldError errors={[errors.dersUcreti]} />
        </Field>
        <div>
          <Button type="submit" disabled={beklemede || !isDirty}>
            {beklemede ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
