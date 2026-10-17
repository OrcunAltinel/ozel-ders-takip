"use client";

import { useState, useTransition } from "react";
import { CalendarXIcon } from "lucide-react";
import { toast } from "sonner";
import { programiSonlandir } from "@/actions/programlar";
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
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ProgramSonlandirDialog({
  programId,
  programAdi,
  bugun,
}: {
  programId: string;
  /** Örn. "Pazartesi 16:00–17:00" */
  programAdi: string;
  bugun: string;
}) {
  const [acik, setAcik] = useState(false);
  const [sonTarih, setSonTarih] = useState(bugun);
  const [beklemede, baslatGecisi] = useTransition();

  function acikligiDegistir(yeniDurum: boolean) {
    if (yeniDurum) setSonTarih(bugun);
    setAcik(yeniDurum);
  }

  function sonlandir() {
    baslatGecisi(async () => {
      const sonuc = await programiSonlandir(programId, sonTarih);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(
        sonuc.sonuc === "silindi"
          ? "Program kaldırıldı."
          : "Program sonlandırıldı. Geçmiş dersler takvimde kalır.",
      );
      setAcik(false);
    });
  }

  return (
    <Dialog open={acik} onOpenChange={acikligiDegistir}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button variant="ghost" size="icon-sm">
                  <CalendarXIcon />
                  <span className="sr-only">Programı sonlandır</span>
                </Button>
              }
            />
          }
        />
        <TooltipContent>Programı sonlandır</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Programı sonlandır</DialogTitle>
          <DialogDescription>
            {programAdi} dersleri seçtiğiniz tarihten sonra takvimden
            kaldırılır. Bu tarihe kadarki dersler ve yoklaması alınmış dersler
            korunur.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="program-son-tarih">Son ders tarihi</FieldLabel>
          <Input
            id="program-son-tarih"
            type="date"
            value={sonTarih}
            onChange={(e) => setSonTarih(e.target.value)}
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAcik(false)}>
            Vazgeç
          </Button>
          <Button
            variant="destructive"
            onClick={sonlandir}
            disabled={beklemede || !sonTarih}
          >
            {beklemede ? "Sonlandırılıyor…" : "Sonlandır"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
