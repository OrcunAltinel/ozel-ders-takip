"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { IslemSonucu } from "@/lib/islem-sonucu";
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

/** Bir işlemi onay dialog'u ile çalıştıran genel bileşen. */
export function OnayDialog({
  tetikleyici,
  baslik,
  aciklama,
  onayEtiketi,
  yikici = false,
  islem,
  basariMesaji,
  yonlendir,
  children,
}: {
  tetikleyici: React.ReactElement;
  baslik: string;
  aciklama: React.ReactNode;
  onayEtiketi: string;
  yikici?: boolean;
  islem: () => Promise<IslemSonucu>;
  basariMesaji: string;
  /** Başarılı işlemden sonra gidilecek sayfa (ör. kayıt artık açılamıyorsa). */
  yonlendir?: string;
  /** Açıklamanın altında gösterilecek ek seçenekler. */
  children?: React.ReactNode;
}) {
  const [acik, setAcik] = useState(false);
  const [beklemede, baslatGecisi] = useTransition();
  const router = useRouter();

  function onayla() {
    baslatGecisi(async () => {
      const sonuc = await islem();
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(basariMesaji);
      setAcik(false);
      if (yonlendir) router.push(yonlendir);
    });
  }

  return (
    <Dialog open={acik} onOpenChange={setAcik}>
      <DialogTrigger render={tetikleyici} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{baslik}</DialogTitle>
          <DialogDescription render={<div />}>{aciklama}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={() => setAcik(false)}>
            Vazgeç
          </Button>
          <Button
            variant={yikici ? "destructive" : "default"}
            onClick={onayla}
            disabled={beklemede}
          >
            {beklemede ? "Lütfen bekleyin…" : onayEtiketi}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
