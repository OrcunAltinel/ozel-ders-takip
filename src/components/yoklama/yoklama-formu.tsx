"use client";

import { useState, useTransition } from "react";
import { CheckIcon, RotateCcwIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { yoklamaKaydet, yoklamayiGeriAl } from "@/actions/yoklama";
import { paraFormatla } from "@/lib/para";
import type { YoklamaDurumu, YoklamaSatiri } from "@/lib/yoklama-verisi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function DurumSecici({
  deger,
  degistir,
  devreDisi,
}: {
  deger: YoklamaDurumu;
  degistir: (durum: YoklamaDurumu) => void;
  devreDisi: boolean;
}) {
  return (
    <div
      role="radiogroup"
      className="inline-flex shrink-0 rounded-lg border p-0.5"
    >
      {(["geldi", "gelmedi"] as const).map((durum) => {
        const secili = deger === durum;
        return (
          <button
            key={durum}
            type="button"
            role="radio"
            aria-checked={secili}
            disabled={devreDisi}
            onClick={() => degistir(durum)}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
              !secili && "text-muted-foreground hover:bg-muted",
              secili &&
                durum === "geldi" &&
                "bg-emerald-600 text-white dark:bg-emerald-500",
              secili && durum === "gelmedi" && "bg-destructive text-white",
            )}
          >
            {durum === "geldi" ? (
              <CheckIcon className="size-3.5" />
            ) : (
              <XIcon className="size-3.5" />
            )}
            {durum === "geldi" ? "Geldi" : "Gelmedi"}
          </button>
        );
      })}
    </div>
  );
}

export function YoklamaFormu({
  dersId,
  satirlar,
  yoklamaAlindi,
  buDersinUcreti,
}: {
  dersId: string;
  satirlar: YoklamaSatiri[];
  yoklamaAlindi: boolean;
  /** Bu dersin tutarı (saatlik ücret × ders süresi); yeni yoklamalarda gelen
   *  her öğrenciye yazılacak değer. Ücret belirlenmemişse null. */
  buDersinUcreti: number | null;
}) {
  // Yoklama alınmamış öğrenciler varsayılan olarak "geldi" başlar.
  const [durumlar, setDurumlar] = useState<Record<string, YoklamaDurumu>>(() =>
    Object.fromEntries(satirlar.map((s) => [s.ogrenciId, s.durum ?? "geldi"])),
  );
  const [beklemede, baslatGecisi] = useTransition();
  const [geriAlAcik, setGeriAlAcik] = useState(false);

  const gelenSayisi = Object.values(durumlar).filter(
    (d) => d === "geldi",
  ).length;

  function kaydet() {
    baslatGecisi(async () => {
      const sonuc = await yoklamaKaydet(
        dersId,
        Object.entries(durumlar).map(([ogrenciId, durum]) => ({
          ogrenciId,
          durum,
        })),
      );
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(
        yoklamaAlindi ? "Yoklama güncellendi." : "Yoklama kaydedildi.",
      );
    });
  }

  function geriAl() {
    baslatGecisi(async () => {
      const sonuc = await yoklamayiGeriAl(dersId);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success("Yoklama geri alındı.");
      setGeriAlAcik(false);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {satirlar.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Bu grupta öğrenci yok. Yine de dersi &quot;yapıldı&quot; olarak
          işaretleyebilirsiniz.
        </p>
      ) : (
        <ul className="flex flex-col divide-y">
          {satirlar.map((satir) => (
            <li
              key={satir.ogrenciId}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {satir.adSoyad}
                </div>
                {satir.gruptanAyrildi || satir.durum === "geldi" ? (
                  <div className="text-xs text-muted-foreground">
                    {satir.gruptanAyrildi ? "Artık bu grupta değil" : null}
                    {satir.gruptanAyrildi && satir.durum === "geldi"
                      ? " · "
                      : null}
                    {/* Ücret yalnızca kaydedilmiş "geldi" yoklamasında borca yazılır. */}
                    {satir.durum === "geldi" && satir.ucret !== null
                      ? `Ücret: ${paraFormatla(satir.ucret)}`
                      : null}
                  </div>
                ) : null}
              </div>
              <DurumSecici
                deger={durumlar[satir.ogrenciId]}
                devreDisi={beklemede}
                degistir={(durum) =>
                  setDurumlar((onceki) => ({
                    ...onceki,
                    [satir.ogrenciId]: durum,
                  }))
                }
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {satirlar.length > 0
            ? `${gelenSayisi}/${satirlar.length} öğrenci geldi`
            : null}
          {!yoklamaAlindi && buDersinUcreti !== null && gelenSayisi > 0
            ? ` · gelen her öğrenciye ${paraFormatla(buDersinUcreti)} yazılır`
            : null}
        </p>
        <div className="flex gap-2">
          {yoklamaAlindi ? (
            <Dialog open={geriAlAcik} onOpenChange={setGeriAlAcik}>
              <DialogTrigger
                render={
                  <Button variant="ghost" size="sm" disabled={beklemede}>
                    <RotateCcwIcon />
                    Geri al
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yoklama geri alınsın mı?</DialogTitle>
                  <DialogDescription>
                    Bu dersin tüm yoklama kayıtları silinir, ders tekrar
                    &quot;planlı&quot; olur ve gelen öğrencilerin borcundan bu
                    dersin ücreti düşer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setGeriAlAcik(false)}
                  >
                    Vazgeç
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={geriAl}
                    disabled={beklemede}
                  >
                    Geri al
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}
          <Button size="sm" onClick={kaydet} disabled={beklemede}>
            {beklemede
              ? "Kaydediliyor…"
              : yoklamaAlindi
                ? "Yoklamayı güncelle"
                : satirlar.length === 0
                  ? "Ders yapıldı"
                  : "Yoklamayı kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
