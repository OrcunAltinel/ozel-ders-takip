"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { programGuncelle, programOlustur } from "@/actions/programlar";
import { haftaninGunuAdi } from "@/lib/zaman/istanbul";
import { saateDakikaEkle } from "@/lib/zaman/saat";
import { programSemasi, type ProgramGirdisi } from "@/lib/validasyon/ders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export type DuzenlenecekProgram = {
  id: string;
  haftaninGunu: number;
  baslangicSaati: string;
  bitisSaati: string;
  baslangicTarihi: string;
  bitisTarihi: string | null;
};

const GUN_OGELERI = [1, 2, 3, 4, 5, 6, 7].map((gun) => ({
  value: gun,
  label: haftaninGunuAdi(gun),
}));

export function ProgramFormuDialog({
  grupId,
  program,
  bugun,
  tetikleyici,
}: {
  grupId: string;
  /** Verilirse düzenleme, verilmezse yeni program formu açılır. */
  program?: DuzenlenecekProgram;
  /** Europe/Istanbul'a göre bugünün tarihi (yyyy-MM-dd). */
  bugun: string;
  tetikleyici: React.ReactElement;
}) {
  const [acik, setAcik] = useState(false);
  const [beklemede, baslatGecisi] = useTransition();

  const varsayilanlar: ProgramGirdisi = {
    haftaninGunu: program?.haftaninGunu ?? 1,
    baslangicSaati: program?.baslangicSaati ?? "16:00",
    bitisSaati: program?.bitisSaati ?? "17:00",
    baslangicTarihi: program?.baslangicTarihi ?? bugun,
    bitisTarihi: program?.bitisTarihi ?? "",
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProgramGirdisi>({
    resolver: zodResolver(programSemasi),
    defaultValues: varsayilanlar,
  });

  const baslangicKaydi = register("baslangicSaati");

  function acikligiDegistir(yeniDurum: boolean) {
    if (yeniDurum) reset(varsayilanlar);
    setAcik(yeniDurum);
  }

  function gonder(girdi: ProgramGirdisi) {
    baslatGecisi(async () => {
      const sonuc = program
        ? await programGuncelle(program.id, girdi)
        : await programOlustur(grupId, girdi);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(program ? "Program güncellendi." : "Program eklendi.");
      setAcik(false);
    });
  }

  return (
    <Dialog open={acik} onOpenChange={acikligiDegistir}>
      <DialogTrigger render={tetikleyici} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {program ? "Programı düzenle" : "Haftalık ders ekle"}
          </DialogTitle>
          <DialogDescription>
            {program
              ? "Değişiklik bugünden itibaren uygulanır; geçmiş dersler ve yoklaması alınmış dersler değişmez."
              : "Grup her hafta seçilen gün ve saatte ders yapar. Dersler takvimde otomatik oluşur."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(gonder)} noValidate>
          <FieldGroup>
            <Controller
              control={control}
              name="haftaninGunu"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Gün</FieldLabel>
                  <Select
                    items={GUN_OGELERI}
                    value={field.value}
                    onValueChange={(deger) => field.onChange(deger ?? 1)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GUN_OGELERI.map((oge) => (
                        <SelectItem key={oge.value} value={oge.value}>
                          {oge.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.baslangicSaati}>
                <FieldLabel htmlFor="program-baslangic">Başlangıç</FieldLabel>
                <Input
                  id="program-baslangic"
                  type="time"
                  step={300}
                  {...baslangicKaydi}
                  onChange={(e) => {
                    baslangicKaydi.onChange(e);
                    const yeni = e.target.value;
                    if (yeni && getValues("bitisSaati") <= yeni) {
                      setValue("bitisSaati", saateDakikaEkle(yeni, 60));
                    }
                  }}
                />
                <FieldError errors={[errors.baslangicSaati]} />
              </Field>
              <Field data-invalid={!!errors.bitisSaati}>
                <FieldLabel htmlFor="program-bitis">Bitiş</FieldLabel>
                <Input
                  id="program-bitis"
                  type="time"
                  step={300}
                  {...register("bitisSaati")}
                />
                <FieldError errors={[errors.bitisSaati]} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.baslangicTarihi}>
                <FieldLabel htmlFor="program-baslangic-tarihi">
                  İlk hafta
                </FieldLabel>
                <Input
                  id="program-baslangic-tarihi"
                  type="date"
                  {...register("baslangicTarihi")}
                />
                <FieldError errors={[errors.baslangicTarihi]} />
              </Field>
              <Field data-invalid={!!errors.bitisTarihi}>
                <FieldLabel htmlFor="program-bitis-tarihi">
                  Son hafta{" "}
                  <span className="font-normal text-muted-foreground">
                    (isteğe bağlı)
                  </span>
                </FieldLabel>
                <Input
                  id="program-bitis-tarihi"
                  type="date"
                  {...register("bitisTarihi")}
                />
                <FieldError errors={[errors.bitisTarihi]} />
              </Field>
            </div>
            <FieldDescription>
              Son hafta boş bırakılırsa program siz sonlandırana kadar devam
              eder.
            </FieldDescription>
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
              {beklemede ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
