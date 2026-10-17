"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { odemeEkle, odemeGuncelle } from "@/actions/odemeler";
import { paraFormatla, tutariGirdiyeYaz } from "@/lib/para";
import type { OgrenciSecenegi } from "@/lib/ogrenci-secenekleri";
import {
  ODEME_YONTEMLERI,
  odemeSemasi,
  type OdemeGirdisi,
  type OdemeYontemi,
} from "@/lib/validasyon/odeme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DuzenlenecekOdeme = {
  id: string;
  ogrenciId: string;
  tutar: number;
  tarih: string;
  odemeYontemi: OdemeYontemi;
  aciklama: string | null;
  ogrenciAdi?: string;
};

const YONTEM_OGELERI = Object.entries(ODEME_YONTEMLERI).map(
  ([value, label]) => ({ value, label }),
);

export function OdemeFormuDialog({
  ogrenciler: tumOgrenciler,
  bugun,
  odeme,
  varsayilanOgrenciId,
  tetikleyici,
}: {
  ogrenciler: OgrenciSecenegi[];
  /** Europe/Istanbul'a göre bugünün tarihi (yyyy-MM-dd). */
  bugun: string;
  /** Verilirse düzenleme, verilmezse yeni ödeme formu açılır. */
  odeme?: DuzenlenecekOdeme;
  /** Yeni ödemede öğrenci önceden seçili gelsin (öğrenci/borç sayfaları). */
  varsayilanOgrenciId?: string;
  tetikleyici: React.ReactElement;
}) {
  const [acik, setAcik] = useState(false);
  const [beklemede, baslatGecisi] = useTransition();

  // Düzenlenen ödemenin öğrencisi listede yoksa (ör. borcu kapanmış arşivdeki
  // öğrenci) seçimin boş görünmemesi için listeye eklenir.
  const ogrenciler =
    odeme && !tumOgrenciler.some((o) => o.id === odeme.ogrenciId)
      ? [
          ...tumOgrenciler,
          {
            id: odeme.ogrenciId,
            adSoyad: odeme.ogrenciAdi ?? "",
            bakiye: 0,
            arsivde: true,
          },
        ]
      : tumOgrenciler;

  const varsayilanlar = (): OdemeGirdisi => {
    if (odeme) {
      return {
        ogrenciId: odeme.ogrenciId,
        tutar: tutariGirdiyeYaz(odeme.tutar),
        tarih: odeme.tarih,
        odemeYontemi: odeme.odemeYontemi,
        aciklama: odeme.aciklama ?? "",
      };
    }
    const ogrenci = ogrenciler.find((o) => o.id === varsayilanOgrenciId);
    return {
      ogrenciId: ogrenci?.id ?? "",
      // Borçlu öğrencide tutar, borcun tamamıyla önerilir.
      tutar:
        ogrenci && ogrenci.bakiye > 0 ? tutariGirdiyeYaz(ogrenci.bakiye) : "",
      tarih: bugun,
      odemeYontemi: "nakit",
      aciklama: "",
    };
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OdemeGirdisi>({
    resolver: zodResolver(odemeSemasi),
    defaultValues: varsayilanlar(),
  });

  const seciliOgrenci = ogrenciler.find((o) => o.id === watch("ogrenciId"));
  const ogrenciOgeleri = ogrenciler.map((o) => ({
    value: o.id,
    label: o.adSoyad,
  }));

  function acikligiDegistir(yeniDurum: boolean) {
    if (yeniDurum) reset(varsayilanlar());
    setAcik(yeniDurum);
  }

  function gonder(girdi: OdemeGirdisi) {
    baslatGecisi(async () => {
      const sonuc = odeme
        ? await odemeGuncelle(odeme.id, girdi)
        : await odemeEkle(girdi);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(odeme ? "Ödeme güncellendi." : "Ödeme kaydedildi.");
      setAcik(false);
    });
  }

  return (
    <Dialog open={acik} onOpenChange={acikligiDegistir}>
      <DialogTrigger render={tetikleyici} />
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{odeme ? "Ödemeyi düzenle" : "Ödeme al"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(gonder)} noValidate>
          <FieldGroup>
            <Controller
              control={control}
              name="ogrenciId"
              render={({ field }) => (
                <Field data-invalid={!!errors.ogrenciId}>
                  <FieldLabel>Öğrenci</FieldLabel>
                  <Select
                    items={ogrenciOgeleri}
                    value={field.value || null}
                    onValueChange={(deger) => field.onChange(deger ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Öğrenci seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {ogrenciler.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.adSoyad}
                          {o.arsivde ? (
                            <span className="text-muted-foreground">
                              (arşivde)
                            </span>
                          ) : null}
                          {o.bakiye > 0 ? (
                            <span className="text-destructive">
                              {paraFormatla(o.bakiye)}
                            </span>
                          ) : null}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {seciliOgrenci && !odeme ? (
                    <FieldDescription>
                      {seciliOgrenci.bakiye > 0
                        ? `Güncel borç: ${paraFormatla(seciliOgrenci.bakiye)}`
                        : seciliOgrenci.bakiye < 0
                          ? `Fazla ödeme (alacak): ${paraFormatla(-seciliOgrenci.bakiye)}`
                          : "Borcu yok."}
                    </FieldDescription>
                  ) : null}
                  <FieldError errors={[errors.ogrenciId]} />
                </Field>
              )}
            />

            <Field data-invalid={!!errors.tutar}>
              <FieldLabel htmlFor="odeme-tutar">Tutar (₺)</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="odeme-tutar"
                  inputMode="decimal"
                  placeholder="örn. 1500"
                  {...register("tutar")}
                />
                {seciliOgrenci && seciliOgrenci.bakiye > 0 && !odeme ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setValue(
                        "tutar",
                        tutariGirdiyeYaz(seciliOgrenci.bakiye),
                        {
                          shouldValidate: true,
                        },
                      )
                    }
                  >
                    Borcun tamamı
                  </Button>
                ) : null}
              </div>
              <FieldError errors={[errors.tutar]} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.tarih}>
                <FieldLabel htmlFor="odeme-tarih">Tarih</FieldLabel>
                <Input
                  id="odeme-tarih"
                  type="date"
                  max={bugun}
                  {...register("tarih")}
                />
                <FieldError errors={[errors.tarih]} />
              </Field>

              <Controller
                control={control}
                name="odemeYontemi"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Yöntem</FieldLabel>
                    <Select
                      items={YONTEM_OGELERI}
                      value={field.value}
                      onValueChange={(deger) =>
                        field.onChange(deger ?? "nakit")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YONTEM_OGELERI.map((oge) => (
                          <SelectItem key={oge.value} value={oge.value}>
                            {oge.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>

            <Field data-invalid={!!errors.aciklama}>
              <FieldLabel htmlFor="odeme-aciklama">
                Açıklama{" "}
                <span className="font-normal text-muted-foreground">
                  (isteğe bağlı)
                </span>
              </FieldLabel>
              <Input id="odeme-aciklama" {...register("aciklama")} />
              <FieldError errors={[errors.aciklama]} />
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
