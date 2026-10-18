"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { ogrenciUcretiAyarla } from "@/actions/gruplar";
import { paraFormatla, tutariGirdiyeYaz } from "@/lib/para";
import {
  ogrenciUcretiSemasi,
  type OgrenciUcretiGirdisi,
} from "@/lib/validasyon/ayarlar";
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
  FieldLabel,
} from "@/components/ui/field";

/**
 * Grup üyesi satırındaki ücret hücresi: geçerli saatlik ücreti gösterir,
 * tıklanınca öğrenciye özel ücret belirleme dialog'unu açar.
 */
export function OgrenciUcretiDialog({
  grupId,
  ogrenciId,
  ogrenciAdi,
  ozelUcret,
  grupUcreti,
}: {
  grupId: string;
  ogrenciId: string;
  ogrenciAdi: string;
  /** Öğrenciye özel ücret; yoksa null. */
  ozelUcret: number | null;
  /** Özel ücret yoksa uygulanacak ücret (grup veya varsayılan); o da yoksa null. */
  grupUcreti: number | null;
}) {
  const [acik, setAcik] = useState(false);
  const [beklemede, baslatGecisi] = useTransition();

  const varsayilanlar: OgrenciUcretiGirdisi = {
    saatlikUcret: ozelUcret === null ? "" : tutariGirdiyeYaz(ozelUcret),
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OgrenciUcretiGirdisi>({
    resolver: zodResolver(ogrenciUcretiSemasi),
    defaultValues: varsayilanlar,
  });

  function acikligiDegistir(yeniDurum: boolean) {
    if (yeniDurum) reset(varsayilanlar);
    setAcik(yeniDurum);
  }

  function gonder(girdi: OgrenciUcretiGirdisi) {
    baslatGecisi(async () => {
      const sonuc = await ogrenciUcretiAyarla(grupId, ogrenciId, girdi);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(
        girdi.saatlikUcret.trim()
          ? `${ogrenciAdi} için özel ücret kaydedildi.`
          : `${ogrenciAdi} için özel ücret kaldırıldı.`,
      );
      setAcik(false);
    });
  }

  const gecerliUcret = ozelUcret ?? grupUcreti;

  return (
    <Dialog open={acik} onOpenChange={acikligiDegistir}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="group inline-flex items-center gap-1.5 rounded-md text-left tabular-nums hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {gecerliUcret === null ? "—" : paraFormatla(gecerliUcret)}
            {ozelUcret !== null ? (
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                Özel
              </span>
            ) : null}
            <PencilIcon className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
            <span className="sr-only">Ücreti düzenle</span>
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kişiye özel ücret</DialogTitle>
          <DialogDescription>{ogrenciAdi}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(gonder)} noValidate>
          <Field data-invalid={!!errors.saatlikUcret}>
            <FieldLabel htmlFor="ogrenci-ucret">Saatlik ücret (₺)</FieldLabel>
            <Input
              id="ogrenci-ucret"
              inputMode="decimal"
              autoFocus
              placeholder={
                grupUcreti === null
                  ? "örn. 300"
                  : `Grup ücreti: ${paraFormatla(grupUcreti)}`
              }
              {...register("saatlikUcret")}
            />
            <FieldDescription>
              Boş bırakılırsa grubun ücreti (grupta ücret yoksa varsayılan
              ücret) kullanılır. Değişiklik yalnızca sonraki yoklamalara
              yansır.
            </FieldDescription>
            <FieldError errors={[errors.saatlikUcret]} />
          </Field>

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
