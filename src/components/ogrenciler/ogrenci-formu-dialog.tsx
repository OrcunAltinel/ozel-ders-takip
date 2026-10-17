"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ogrenciGuncelle, ogrenciOlustur } from "@/actions/ogrenciler";
import { telefonFormatla } from "@/lib/telefon";
import { ogrenciSemasi, type OgrenciGirdisi } from "@/lib/validasyon/ogrenci";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Select bileşeni boş string değer taşıyamadığı için "grupsuz" seçeneğinin değeri. */
const GRUPSUZ = "__grupsuz__";

type DuzenlenecekOgrenci = {
  id: string;
  ad_soyad: string;
  telefon: string | null;
  veli_ad: string | null;
  veli_telefon: string | null;
  grup_id: string | null;
  notlar: string | null;
};

type GrupSecenegi = { id: string; ad: string };

export function OgrenciFormuDialog({
  ogrenci,
  gruplar,
  tetikleyici,
}: {
  /** Verilirse düzenleme, verilmezse yeni öğrenci formu açılır. */
  ogrenci?: DuzenlenecekOgrenci;
  gruplar: GrupSecenegi[];
  tetikleyici: React.ReactElement;
}) {
  const [acik, setAcik] = useState(false);
  const [beklemede, baslatGecisi] = useTransition();

  const varsayilanlar: OgrenciGirdisi = {
    adSoyad: ogrenci?.ad_soyad ?? "",
    telefon: ogrenci?.telefon ? telefonFormatla(ogrenci.telefon) : "",
    veliAd: ogrenci?.veli_ad ?? "",
    veliTelefon: ogrenci?.veli_telefon
      ? telefonFormatla(ogrenci.veli_telefon)
      : "",
    grupId: ogrenci?.grup_id ?? "",
    notlar: ogrenci?.notlar ?? "",
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OgrenciGirdisi>({
    resolver: zodResolver(ogrenciSemasi),
    defaultValues: varsayilanlar,
  });

  const grupOgeleri = [
    { value: GRUPSUZ, label: "Grupsuz" },
    ...gruplar.map((g) => ({ value: g.id, label: g.ad })),
  ];

  function acikligiDegistir(yeniDurum: boolean) {
    if (yeniDurum) reset(varsayilanlar);
    setAcik(yeniDurum);
  }

  function gonder(girdi: OgrenciGirdisi) {
    baslatGecisi(async () => {
      const sonuc = ogrenci
        ? await ogrenciGuncelle(ogrenci.id, girdi)
        : await ogrenciOlustur(girdi);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(ogrenci ? "Öğrenci güncellendi." : "Öğrenci eklendi.");
      setAcik(false);
    });
  }

  return (
    <Dialog open={acik} onOpenChange={acikligiDegistir}>
      <DialogTrigger render={tetikleyici} />
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {ogrenci ? "Öğrenciyi düzenle" : "Yeni öğrenci"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(gonder)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.adSoyad}>
              <FieldLabel htmlFor="ogrenci-ad">Ad soyad</FieldLabel>
              <Input id="ogrenci-ad" autoFocus {...register("adSoyad")} />
              <FieldError errors={[errors.adSoyad]} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                control={control}
                name="grupId"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Grup</FieldLabel>
                    <Select
                      items={grupOgeleri}
                      value={field.value || GRUPSUZ}
                      onValueChange={(deger) =>
                        field.onChange(deger === GRUPSUZ ? "" : (deger ?? ""))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {grupOgeleri.map((oge) => (
                          <SelectItem key={oge.value} value={oge.value}>
                            {oge.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              <Field data-invalid={!!errors.telefon}>
                <FieldLabel htmlFor="ogrenci-telefon">Telefon</FieldLabel>
                <Input
                  id="ogrenci-telefon"
                  type="tel"
                  inputMode="tel"
                  placeholder="0532 123 45 67"
                  {...register("telefon")}
                />
                <FieldError errors={[errors.telefon]} />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.veliAd}>
                <FieldLabel htmlFor="ogrenci-veli-ad">
                  Veli adı{" "}
                  <span className="font-normal text-muted-foreground">
                    (isteğe bağlı)
                  </span>
                </FieldLabel>
                <Input id="ogrenci-veli-ad" {...register("veliAd")} />
                <FieldError errors={[errors.veliAd]} />
              </Field>

              <Field data-invalid={!!errors.veliTelefon}>
                <FieldLabel htmlFor="ogrenci-veli-telefon">
                  Veli telefonu{" "}
                  <span className="font-normal text-muted-foreground">
                    (isteğe bağlı)
                  </span>
                </FieldLabel>
                <Input
                  id="ogrenci-veli-telefon"
                  type="tel"
                  inputMode="tel"
                  placeholder="0532 123 45 67"
                  {...register("veliTelefon")}
                />
                <FieldError errors={[errors.veliTelefon]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.notlar}>
              <FieldLabel htmlFor="ogrenci-notlar">Notlar</FieldLabel>
              <Textarea
                id="ogrenci-notlar"
                rows={3}
                placeholder="İsteğe bağlı"
                {...register("notlar")}
              />
              <FieldError errors={[errors.notlar]} />
            </Field>
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
