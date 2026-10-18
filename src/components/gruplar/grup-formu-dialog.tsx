"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { grupGuncelle, grupOlustur } from "@/actions/gruplar";
import { paraFormatla, tutariGirdiyeYaz } from "@/lib/para";
import {
  GRUP_RENKLERI,
  grupSemasi,
  type GrupGirdisi,
} from "@/lib/validasyon/grup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

type DuzenlenecekGrup = {
  id: string;
  ad: string;
  aciklama: string | null;
  renk: string;
  saatlik_ucret: number | null;
};

export function GrupFormuDialog({
  grup,
  varsayilanUcret,
  tetikleyici,
}: {
  /** Verilirse düzenleme, verilmezse yeni grup formu açılır. */
  grup?: DuzenlenecekGrup;
  /** Hocanın varsayılan saatlik ücreti (Ayarlar); belirlenmemişse null. */
  varsayilanUcret: number | null;
  tetikleyici: React.ReactElement;
}) {
  const [acik, setAcik] = useState(false);
  const [beklemede, baslatGecisi] = useTransition();

  const varsayilanlar: GrupGirdisi = {
    ad: grup?.ad ?? "",
    aciklama: grup?.aciklama ?? "",
    renk: grup?.renk ?? GRUP_RENKLERI[0],
    saatlikUcret:
      grup?.saatlik_ucret == null ? "" : tutariGirdiyeYaz(grup.saatlik_ucret),
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GrupGirdisi>({
    resolver: zodResolver(grupSemasi),
    defaultValues: varsayilanlar,
  });

  function acikligiDegistir(yeniDurum: boolean) {
    if (yeniDurum) reset(varsayilanlar);
    setAcik(yeniDurum);
  }

  function gonder(girdi: GrupGirdisi) {
    baslatGecisi(async () => {
      const sonuc = grup
        ? await grupGuncelle(grup.id, girdi)
        : await grupOlustur(girdi);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(grup ? "Grup güncellendi." : "Grup oluşturuldu.");
      setAcik(false);
    });
  }

  return (
    <Dialog open={acik} onOpenChange={acikligiDegistir}>
      <DialogTrigger render={tetikleyici} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{grup ? "Grubu düzenle" : "Yeni grup"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(gonder)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.ad}>
              <FieldLabel htmlFor="grup-ad">Grup adı</FieldLabel>
              <Input id="grup-ad" autoFocus {...register("ad")} />
              <FieldError errors={[errors.ad]} />
            </Field>

            <Field data-invalid={!!errors.aciklama}>
              <FieldLabel htmlFor="grup-aciklama">Açıklama</FieldLabel>
              <Textarea
                id="grup-aciklama"
                rows={2}
                placeholder="İsteğe bağlı"
                {...register("aciklama")}
              />
              <FieldError errors={[errors.aciklama]} />
            </Field>

            <Field data-invalid={!!errors.saatlikUcret}>
              <FieldLabel htmlFor="grup-ucret">Saatlik ücret (₺)</FieldLabel>
              <Input
                id="grup-ucret"
                inputMode="decimal"
                placeholder={
                  varsayilanUcret === null
                    ? "İsteğe bağlı"
                    : `Varsayılan: ${paraFormatla(varsayilanUcret)}`
                }
                {...register("saatlikUcret")}
              />
              <FieldDescription>
                Boş bırakılırsa Ayarlar&apos;daki varsayılan saatlik ücret
                kullanılır. Değişiklik yalnızca sonraki yoklamalara yansır.
              </FieldDescription>
              <FieldError errors={[errors.saatlikUcret]} />
            </Field>

            <Controller
              control={control}
              name="renk"
              render={({ field }) => (
                <Field data-invalid={!!errors.renk}>
                  <FieldLabel>Takvim rengi</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {GRUP_RENKLERI.map((renk) => (
                      <button
                        key={renk}
                        type="button"
                        onClick={() => field.onChange(renk)}
                        aria-label={`Renk ${renk}`}
                        aria-pressed={field.value === renk}
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition",
                          field.value === renk && "ring-2 ring-foreground",
                        )}
                        style={{ backgroundColor: renk }}
                      >
                        {field.value === renk ? (
                          <CheckIcon className="size-4 text-white" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                  <FieldError errors={[errors.renk]} />
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAcik(false)}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={beklemede}>
              {beklemede ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
