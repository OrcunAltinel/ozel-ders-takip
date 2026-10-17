"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { dersGuncelle, dersOlustur, type TakvimDersi } from "@/actions/dersler";
import { haftaninGunuAdi } from "@/lib/zaman/istanbul";
import { saateDakikaEkle, tarihinHaftaGunu } from "@/lib/zaman/saat";
import {
  dersDuzenleSemasi,
  dersOlusturSemasi,
  type DersOlusturGirdisi,
} from "@/lib/validasyon/ders";
import { RenkNoktasi } from "@/components/gruplar/renk-noktasi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

export type GrupSecenegi = { id: string; ad: string; renk: string };

export type YeniDersBaslangici = {
  tarih: string;
  baslangicSaati: string;
  bitisSaati: string;
};

type Ozellikler = {
  acik: boolean;
  acikligiDegistir: (acik: boolean) => void;
  gruplar: GrupSecenegi[];
  /** Kayıt başarılı olunca (takvimi yenilemek için) çağrılır. */
  kaydedilince: () => void;
} & (
  | { mod: "yeni"; baslangic: YeniDersBaslangici }
  | { mod: "duzenle"; ders: TakvimDersi }
);

/**
 * Takvimden ders ekleme ve tek bir dersi düzenleme formu. Her açılışta
 * güncel varsayılanlarla başlaması için üst bileşen `key` ile yeniden oluşturur.
 */
export function DersFormuDialog(ozellikler: Ozellikler) {
  const { acik, acikligiDegistir, gruplar, kaydedilince } = ozellikler;
  const duzenleme = ozellikler.mod === "duzenle";
  const [beklemede, baslatGecisi] = useTransition();

  const varsayilanlar: DersOlusturGirdisi =
    ozellikler.mod === "duzenle"
      ? {
          grupId: ozellikler.ders.grupId,
          tarih: ozellikler.ders.tarih,
          baslangicSaati: ozellikler.ders.baslangicSaati,
          bitisSaati: ozellikler.ders.bitisSaati,
          konu: ozellikler.ders.konu ?? "",
          tekrarla: false,
          tekrarBitisTarihi: "",
        }
      : {
          grupId: gruplar.length === 1 ? gruplar[0].id : "",
          ...ozellikler.baslangic,
          konu: "",
          tekrarla: false,
          tekrarBitisTarihi: "",
        };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<DersOlusturGirdisi>({
    // Düzenlemede grup/tekrar alanları kullanılmaz; yalnızca tarih/saat/konu doğrulanır.
    resolver: (duzenleme
      ? zodResolver(dersDuzenleSemasi)
      : zodResolver(dersOlusturSemasi)) as unknown as Resolver<DersOlusturGirdisi>,
    defaultValues: varsayilanlar,
  });

  const tekrarla = watch("tekrarla");
  const tarih = watch("tarih");
  const grupOgeleri = gruplar.map((g) => ({ value: g.id, label: g.ad }));

  const baslangicKaydi = register("baslangicSaati");

  function gonder(girdi: DersOlusturGirdisi) {
    baslatGecisi(async () => {
      const sonuc =
        ozellikler.mod === "duzenle"
          ? await dersGuncelle(ozellikler.ders.id, girdi)
          : await dersOlustur(girdi);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(
        duzenleme
          ? "Ders güncellendi."
          : girdi.tekrarla
            ? "Haftalık program oluşturuldu."
            : "Ders eklendi.",
      );
      acikligiDegistir(false);
      kaydedilince();
    });
  }

  return (
    <Dialog open={acik} onOpenChange={acikligiDegistir}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{duzenleme ? "Dersi düzenle" : "Yeni ders"}</DialogTitle>
          {ozellikler.mod === "duzenle" && ozellikler.ders.tekrarlayan ? (
            <DialogDescription>
              Bu ders haftalık programdan geliyor. Burada yaptığınız değişiklik
              yalnızca bu tarihteki dersi etkiler; programın kendisini grup
              sayfasından düzenleyebilirsiniz.
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {!duzenleme && gruplar.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ders eklemek için önce bir grup oluşturun.{" "}
            <Link href="/gruplar" className="font-medium underline">
              Gruplar
            </Link>
          </p>
        ) : (
          <form onSubmit={handleSubmit(gonder)} noValidate>
            <FieldGroup>
              {ozellikler.mod === "duzenle" ? (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <RenkNoktasi renk={ozellikler.ders.renk} />
                  {ozellikler.ders.grupAdi}
                </div>
              ) : (
                <Controller
                  control={control}
                  name="grupId"
                  render={({ field }) => (
                    <Field data-invalid={!!errors.grupId}>
                      <FieldLabel>Grup</FieldLabel>
                      <Select
                        items={grupOgeleri}
                        value={field.value || null}
                        onValueChange={(deger) => field.onChange(deger ?? "")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Grup seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {gruplar.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              <RenkNoktasi renk={g.renk} />
                              {g.ad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[errors.grupId]} />
                    </Field>
                  )}
                />
              )}

              <Field data-invalid={!!errors.tarih}>
                <FieldLabel htmlFor="ders-tarih">Tarih</FieldLabel>
                <Input id="ders-tarih" type="date" {...register("tarih")} />
                <FieldError errors={[errors.tarih]} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!errors.baslangicSaati}>
                  <FieldLabel htmlFor="ders-baslangic">Başlangıç</FieldLabel>
                  <Input
                    id="ders-baslangic"
                    type="time"
                    step={300}
                    {...baslangicKaydi}
                    onChange={(e) => {
                      baslangicKaydi.onChange(e);
                      // Bitiş, başlangıçtan önce kalırsa 1 saat sonrasına kaydırılır.
                      const yeni = e.target.value;
                      if (yeni && getValues("bitisSaati") <= yeni) {
                        setValue("bitisSaati", saateDakikaEkle(yeni, 60));
                      }
                    }}
                  />
                  <FieldError errors={[errors.baslangicSaati]} />
                </Field>
                <Field data-invalid={!!errors.bitisSaati}>
                  <FieldLabel htmlFor="ders-bitis">Bitiş</FieldLabel>
                  <Input
                    id="ders-bitis"
                    type="time"
                    step={300}
                    {...register("bitisSaati")}
                  />
                  <FieldError errors={[errors.bitisSaati]} />
                </Field>
              </div>

              {!duzenleme ? (
                <Controller
                  control={control}
                  name="tekrarla"
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Switch
                        id="ders-tekrarla"
                        checked={field.value}
                        onCheckedChange={(deger) => field.onChange(deger)}
                      />
                      <FieldLabel htmlFor="ders-tekrarla" className="font-normal">
                        Her hafta tekrarla
                        {tarih && tarihinHaftaGunu(tarih)
                          ? ` (her ${haftaninGunuAdi(tarihinHaftaGunu(tarih))})`
                          : ""}
                      </FieldLabel>
                    </Field>
                  )}
                />
              ) : null}

              {!duzenleme && tekrarla ? (
                <Field data-invalid={!!errors.tekrarBitisTarihi}>
                  <FieldLabel htmlFor="ders-tekrar-bitis">
                    Son ders tarihi{" "}
                    <span className="font-normal text-muted-foreground">
                      (isteğe bağlı)
                    </span>
                  </FieldLabel>
                  <Input
                    id="ders-tekrar-bitis"
                    type="date"
                    {...register("tekrarBitisTarihi")}
                  />
                  <FieldDescription>
                    Boş bırakırsanız program siz sonlandırana kadar devam eder.
                  </FieldDescription>
                  <FieldError errors={[errors.tekrarBitisTarihi]} />
                </Field>
              ) : null}

              {duzenleme || !tekrarla ? (
                <Field data-invalid={!!errors.konu}>
                  <FieldLabel htmlFor="ders-konu">
                    Konu{" "}
                    <span className="font-normal text-muted-foreground">
                      (isteğe bağlı)
                    </span>
                  </FieldLabel>
                  <Input id="ders-konu" {...register("konu")} />
                  <FieldError errors={[errors.konu]} />
                </Field>
              ) : null}
            </FieldGroup>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => acikligiDegistir(false)}
              >
                Vazgeç
              </Button>
              <Button type="submit" disabled={beklemede}>
                {beklemede ? "Kaydediliyor…" : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
