"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  BanIcon,
  CalendarIcon,
  ClipboardCheckIcon,
  ClockIcon,
  PencilIcon,
  RepeatIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import {
  dersIptalDurumunuDegistir,
  dersSil,
  type DersDurumu,
  type TakvimDersi,
} from "@/actions/dersler";
import { bugununTarihi, tarihFormatla } from "@/lib/zaman/istanbul";
import { RenkNoktasi } from "@/components/gruplar/renk-noktasi";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DURUM_ETIKETLERI: Record<DersDurumu, string> = {
  planli: "Planlı",
  yapildi: "Yapıldı",
  iptal: "İptal",
};

export function DersDetayDialog({
  ders,
  acikligiDegistir,
  duzenle,
  degisince,
}: {
  ders: TakvimDersi | null;
  acikligiDegistir: (acik: boolean) => void;
  /** "Düzenle"ye basılınca düzenleme formunu açar. */
  duzenle: (ders: TakvimDersi) => void;
  /** Ders iptal edildiğinde/silindiğinde takvimi yenilemek için. */
  degisince: () => void;
}) {
  const [beklemede, baslatGecisi] = useTransition();

  function islemYap(
    islem: () => Promise<{ hata: string } | { basarili: true }>,
    basariMesaji: string,
  ) {
    baslatGecisi(async () => {
      const sonuc = await islem();
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(basariMesaji);
      acikligiDegistir(false);
      degisince();
    });
  }

  return (
    <Dialog open={ders !== null} onOpenChange={acikligiDegistir}>
      <DialogContent className="sm:max-w-md">
        {ders ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RenkNoktasi renk={ders.renk} className="size-3" />
                <Link
                  href={`/gruplar/${ders.grupId}`}
                  className="hover:underline"
                >
                  {ders.grupAdi}
                </Link>
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant={
                    ders.durum === "iptal"
                      ? "destructive"
                      : ders.durum === "yapildi"
                        ? "default"
                        : "secondary"
                  }
                >
                  {DURUM_ETIKETLERI[ders.durum]}
                </Badge>
                {ders.tekrarlayan ? (
                  <Badge variant="outline">
                    <RepeatIcon />
                    Haftalık program
                  </Badge>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-muted-foreground" />
                {tarihFormatla(ders.tarih)}
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="size-4 text-muted-foreground" />
                {ders.baslangicSaati} – {ders.bitisSaati}
              </div>
              {ders.konu ? (
                <p className="rounded-lg bg-muted px-3 py-2">{ders.konu}</p>
              ) : null}
              {ders.yoklamaVar ? (
                <p className="text-muted-foreground">
                  Bu dersin yoklaması alınmış; iptal edilemez veya silinemez.
                </p>
              ) : null}
            </div>

            <DialogFooter className="sm:justify-between">
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {!ders.tekrarlayan && !ders.yoklamaVar ? (
                  <Button
                    variant="destructive"
                    disabled={beklemede}
                    onClick={() =>
                      islemYap(() => dersSil(ders.id), "Ders silindi.")
                    }
                  >
                    <Trash2Icon />
                    Sil
                  </Button>
                ) : null}
                {!ders.yoklamaVar && ders.durum !== "yapildi" ? (
                  ders.durum === "iptal" ? (
                    <Button
                      variant="outline"
                      disabled={beklemede}
                      onClick={() =>
                        islemYap(
                          () => dersIptalDurumunuDegistir(ders.id, false),
                          "İptal geri alındı.",
                        )
                      }
                    >
                      <RotateCcwIcon />
                      İptali geri al
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={beklemede}
                      onClick={() =>
                        islemYap(
                          () => dersIptalDurumunuDegistir(ders.id, true),
                          "Ders iptal edildi.",
                        )
                      }
                    >
                      <BanIcon />
                      İptal et
                    </Button>
                  )
                ) : null}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  disabled={beklemede}
                  onClick={() => duzenle(ders)}
                >
                  <PencilIcon />
                  Düzenle
                </Button>
                {ders.durum !== "iptal" && ders.tarih <= bugununTarihi() ? (
                  <Link
                    href={`/dersler/${ders.id}`}
                    className={buttonVariants()}
                  >
                    <ClipboardCheckIcon />
                    {ders.yoklamaVar || ders.durum === "yapildi"
                      ? "Yoklamayı gör"
                      : "Yoklama al"}
                  </Link>
                ) : null}
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
