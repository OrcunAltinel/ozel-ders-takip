"use client";

import { useState } from "react";
import { ArchiveIcon, ArchiveRestoreIcon, Trash2Icon } from "lucide-react";
import { grupArsivdenCikar, grupArsivle, grupKaliciSil } from "@/actions/arsiv";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel } from "@/components/ui/field";
import { OnayDialog } from "./onay-dialog";

export function GrupArsivleButonu({
  grupId,
  grupAdi,
  ogrenciSayisi,
  programSayisi,
}: {
  grupId: string;
  grupAdi: string;
  ogrenciSayisi: number;
  programSayisi: number;
}) {
  const [ogrencileriDe, setOgrencileriDe] = useState(false);

  return (
    <OnayDialog
      tetikleyici={
        <Button variant="outline">
          <ArchiveIcon />
          Arşivle
        </Button>
      }
      baslik={`${grupAdi} arşivlensin mi?`}
      aciklama={
        <ul className="list-disc space-y-1 pl-4">
          {programSayisi > 0 ? (
            <li>
              Haftalık program bugün sona erer; gelecekteki dersler takvimden
              kalkar.
            </li>
          ) : (
            <li>Gelecekteki dersler takvimden kalkar.</li>
          )}
          <li>Geçmiş dersler ve yoklamalar korunur.</li>
          {ogrenciSayisi > 0 ? (
            <li>
              Gruptaki {ogrenciSayisi} öğrenci{" "}
              {ogrencileriDe ? "de arşivlenir" : "grupsuz kalır"}.
            </li>
          ) : null}
        </ul>
      }
      onayEtiketi="Arşivle"
      islem={() => grupArsivle(grupId, ogrencileriDe)}
      basariMesaji="Grup arşivlendi."
      yonlendir="/gruplar"
    >
      {ogrenciSayisi > 0 ? (
        <FieldLabel htmlFor="ogrencileri-de" className="flex-row items-center">
          <Checkbox
            id="ogrencileri-de"
            checked={ogrencileriDe}
            onCheckedChange={(deger) => setOgrencileriDe(deger === true)}
          />
          Öğrencileri de arşivle
        </FieldLabel>
      ) : null}
    </OnayDialog>
  );
}

export function GrupArsivdenCikarButonu({ grupId }: { grupId: string }) {
  return (
    <OnayDialog
      tetikleyici={
        <Button variant="outline" size="sm">
          <ArchiveRestoreIcon />
          Arşivden çıkar
        </Button>
      }
      baslik="Grup arşivden çıkarılsın mı?"
      aciklama="Grup tekrar aktif olur. Haftalık programını ve öğrencilerini grup sayfasından yeniden eklemeniz gerekir."
      onayEtiketi="Arşivden çıkar"
      islem={() => grupArsivdenCikar(grupId)}
      basariMesaji="Grup arşivden çıkarıldı."
    />
  );
}

export function GrupKaliciSilButonu({
  grupId,
  grupAdi,
}: {
  grupId: string;
  grupAdi: string;
}) {
  return (
    <OnayDialog
      tetikleyici={
        <Button variant="destructive" size="sm">
          <Trash2Icon />
          Kalıcı sil
        </Button>
      }
      baslik={`${grupAdi} kalıcı olarak silinsin mi?`}
      aciklama="Grup ve haftalık programları silinir. Bu işlem geri alınamaz."
      onayEtiketi="Kalıcı sil"
      yikici
      islem={() => grupKaliciSil(grupId)}
      basariMesaji="Grup kalıcı olarak silindi."
    />
  );
}
