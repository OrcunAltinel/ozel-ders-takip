"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { saatlikUcretKaydet } from "@/actions/ayarlar";
import { tutariGirdiyeYaz } from "@/lib/para";
import {
  saatlikUcretSemasi,
  type SaatlikUcretGirdisi,
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
  } = useForm<SaatlikUcretGirdisi>({
    resolver: zodResolver(saatlikUcretSemasi),
    defaultValues: {
      saatlikUcret: mevcutUcret === null ? "" : tutariGirdiyeYaz(mevcutUcret),
    },
  });

  function gonder(girdi: SaatlikUcretGirdisi) {
    baslatGecisi(async () => {
      const sonuc = await saatlikUcretKaydet(girdi);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success("Saatlik ücret kaydedildi.");
      reset(girdi);
    });
  }

  return (
    <form onSubmit={handleSubmit(gonder)} noValidate className="max-w-sm">
      <FieldGroup>
        <Field data-invalid={!!errors.saatlikUcret}>
          <FieldLabel htmlFor="saatlik-ucret">Saatlik ücret (₺)</FieldLabel>
          <Input
            id="saatlik-ucret"
            inputMode="decimal"
            placeholder="örn. 300"
            {...register("saatlikUcret")}
          />
          <FieldDescription>
            Tüm öğrenciler için geçerlidir. Bir dersin ücreti, saatlik ücret ile
            ders süresinin çarpımıdır (ör. 2 saatlik ders = 2 × saatlik ücret).
            Ücreti değiştirirseniz yeni ücret yalnızca bundan sonra alınacak
            yoklamalara uygulanır; geçmiş dersler eski ücretle kalır.
          </FieldDescription>
          <FieldError errors={[errors.saatlikUcret]} />
        </Field>
        <div>
          <Button type="submit" disabled={beklemede || !isDirty}>
            {beklemede ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
