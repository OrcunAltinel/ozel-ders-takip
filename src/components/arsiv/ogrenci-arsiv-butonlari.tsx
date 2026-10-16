"use client";

import { ArchiveIcon, ArchiveRestoreIcon, Trash2Icon } from "lucide-react";
import {
  ogrenciArsivdenCikar,
  ogrenciArsivle,
  ogrenciKaliciSil,
} from "@/actions/arsiv";
import { paraFormatla } from "@/lib/para";
import { Button } from "@/components/ui/button";
import { OnayDialog } from "./onay-dialog";

export function OgrenciArsivleButonu({
  ogrenciId,
  adSoyad,
  bakiye,
}: {
  ogrenciId: string;
  adSoyad: string;
  bakiye: number;
}) {
  return (
    <OnayDialog
      tetikleyici={
        <Button variant="outline">
          <ArchiveIcon />
          Arşivle
        </Button>
      }
      baslik={`${adSoyad} arşivlensin mi?`}
      aciklama={
        <>
          Öğrenci listelerden ve yoklamalardan kalkar; ders ve ödeme geçmişi
          korunur. İstediğiniz zaman Arşiv sayfasından geri alabilirsiniz.
          {bakiye > 0 ? (
            <span className="mt-2 block font-medium text-foreground">
              {paraFormatla(bakiye)} borcu var; Borçlar sayfasında
              &quot;Arşivde&quot; etiketiyle görünmeye devam eder.
            </span>
          ) : null}
        </>
      }
      onayEtiketi="Arşivle"
      islem={() => ogrenciArsivle(ogrenciId)}
      basariMesaji="Öğrenci arşivlendi."
    />
  );
}

export function OgrenciArsivdenCikarButonu({
  ogrenciId,
  boyut = "default",
}: {
  ogrenciId: string;
  boyut?: "default" | "sm";
}) {
  return (
    <OnayDialog
      tetikleyici={
        <Button variant="outline" size={boyut}>
          <ArchiveRestoreIcon />
          Arşivden çıkar
        </Button>
      }
      baslik="Öğrenci arşivden çıkarılsın mı?"
      aciklama="Öğrenci tekrar aktif listelere döner. Eski grubu arşivdeyse grupsuz olarak döner."
      onayEtiketi="Arşivden çıkar"
      islem={() => ogrenciArsivdenCikar(ogrenciId)}
      basariMesaji="Öğrenci arşivden çıkarıldı."
    />
  );
}

export function OgrenciKaliciSilButonu({
  ogrenciId,
  adSoyad,
  boyut = "default",
  yonlendir,
}: {
  ogrenciId: string;
  adSoyad: string;
  boyut?: "default" | "sm";
  yonlendir?: string;
}) {
  return (
    <OnayDialog
      tetikleyici={
        <Button variant="destructive" size={boyut}>
          <Trash2Icon />
          Kalıcı sil
        </Button>
      }
      baslik={`${adSoyad} kalıcı olarak silinsin mi?`}
      aciklama="Öğrencinin tüm bilgileri silinir. Bu işlem geri alınamaz."
      onayEtiketi="Kalıcı sil"
      yikici
      islem={() => ogrenciKaliciSil(ogrenciId)}
      basariMesaji="Öğrenci kalıcı olarak silindi."
      yonlendir={yonlendir}
    />
  );
}
