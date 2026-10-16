"use client";

import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { odemeSil } from "@/actions/odemeler";
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

export function OdemeSilButonu({
  odemeId,
  ozet,
}: {
  odemeId: string;
  /** Örn. "Ali Veli · 1.500,00 ₺ · 17 Eki 2026" */
  ozet: string;
}) {
  const [acik, setAcik] = useState(false);
  const [beklemede, baslatGecisi] = useTransition();

  function sil() {
    baslatGecisi(async () => {
      const sonuc = await odemeSil(odemeId);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success("Ödeme silindi.");
      setAcik(false);
    });
  }

  return (
    <Dialog open={acik} onOpenChange={setAcik}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <Trash2Icon />
            <span className="sr-only">Ödemeyi sil</span>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ödeme silinsin mi?</DialogTitle>
          <DialogDescription>
            {ozet}. Silinen ödeme öğrencinin borcuna geri eklenir. Bu işlem geri
            alınamaz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAcik(false)}>
            Vazgeç
          </Button>
          <Button variant="destructive" onClick={sil} disabled={beklemede}>
            {beklemede ? "Siliniyor..." : "Sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
