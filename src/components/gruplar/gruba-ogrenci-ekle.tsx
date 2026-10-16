"use client";

import { useState, useTransition } from "react";
import { UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import { grubaOgrenciEkle } from "@/actions/gruplar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Aday = { id: string; adSoyad: string; mevcutGrup: string | null };

export function GrubaOgrenciEkle({
  grupId,
  adaylar,
}: {
  grupId: string;
  adaylar: Aday[];
}) {
  const [acik, setAcik] = useState(false);
  const [secilen, setSecilen] = useState<string | null>(null);
  const [beklemede, baslatGecisi] = useTransition();

  const secilenAday = adaylar.find((a) => a.id === secilen);
  const ogeler = adaylar.map((a) => ({ value: a.id, label: a.adSoyad }));

  function acikligiDegistir(yeniDurum: boolean) {
    if (yeniDurum) setSecilen(null);
    setAcik(yeniDurum);
  }

  function ekle() {
    if (!secilen) return;
    baslatGecisi(async () => {
      const sonuc = await grubaOgrenciEkle(grupId, secilen);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success("Öğrenci gruba eklendi.");
      setAcik(false);
    });
  }

  return (
    <Dialog open={acik} onOpenChange={acikligiDegistir}>
      <DialogTrigger
        render={
          <Button>
            <UserPlusIcon />
            Öğrenci ekle
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gruba öğrenci ekle</DialogTitle>
          <DialogDescription>
            Bir öğrenci aynı anda yalnızca bir grupta olabilir. Başka bir
            gruptaki öğrenciyi seçerseniz bu gruba taşınır.
          </DialogDescription>
        </DialogHeader>

        {adaylar.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Eklenebilecek öğrenci yok. Önce Öğrenciler sayfasından öğrenci
            ekleyin.
          </p>
        ) : (
          <Select items={ogeler} value={secilen} onValueChange={setSecilen}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Öğrenci seçin" />
            </SelectTrigger>
            <SelectContent>
              {adaylar.map((aday) => (
                <SelectItem key={aday.id} value={aday.id}>
                  {aday.adSoyad}
                  <span className="text-muted-foreground">
                    {aday.mevcutGrup ? `(${aday.mevcutGrup})` : "(grupsuz)"}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {secilenAday?.mevcutGrup ? (
          <p className="text-sm text-amber-600">
            {secilenAday.adSoyad} şu an &quot;{secilenAday.mevcutGrup}&quot;
            grubunda; eklerseniz o gruptan çıkarılacak.
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setAcik(false)}>
            Vazgeç
          </Button>
          <Button onClick={ekle} disabled={!secilen || beklemede}>
            {beklemede ? "Ekleniyor..." : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
