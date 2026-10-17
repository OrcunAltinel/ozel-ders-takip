"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";
import type { OgrenciSecenegi } from "@/lib/ogrenci-secenekleri";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OdemeTablosu, type OdemeSatiri } from "./odeme-tablosu";

/** Türkçe karakterleri de doğru küçülterek aramayı büyük/küçük harf duyarsız yapar. */
function normallestir(metin: string): string {
  return metin.toLocaleLowerCase("tr-TR");
}

/**
 * Seçili ayın ödemelerini öğrenci adına göre istemci tarafında filtreler.
 * Filtre URL'ye (?ad=) yansır (paylaşılabilir); ay değişince sıfırlanır.
 */
export function OdemelerListesi({
  odemeler,
  ogrenciler,
  bugun,
}: {
  odemeler: OdemeSatiri[];
  ogrenciler: OgrenciSecenegi[];
  bugun: string;
}) {
  const searchParams = useSearchParams();
  const [arama, setArama] = useState(() => searchParams.get("ad") ?? "");

  // Ad filtresini URL'ye yaz; ay (?ay=) gibi diğer parametreler korunur.
  // Sunucuyu yeniden çalıştırmamak için History API kullanılır.
  const urlGuncelle = useCallback((yeniArama: string) => {
    const params = new URLSearchParams(window.location.search);
    if (yeniArama.trim()) params.set("ad", yeniArama.trim());
    else params.delete("ad");
    const sorgu = params.toString();
    window.history.replaceState(
      null,
      "",
      sorgu ? `?${sorgu}` : window.location.pathname,
    );
  }, []);

  const gorunenler = useMemo(() => {
    const aranan = normallestir(arama.trim());
    if (!aranan) return odemeler;
    return odemeler.filter((o) => normallestir(o.ogrenciAdi).includes(aranan));
  }, [odemeler, arama]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative min-w-48 max-w-xs">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={arama}
          onChange={(e) => {
            setArama(e.target.value);
            urlGuncelle(e.target.value);
          }}
          placeholder="İsme göre filtrele"
          className="pl-8"
          aria-label="Ödemelerde isme göre ara"
        />
      </div>

      {gorunenler.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Aramanızla eşleşen ödeme bulunamadı.
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <OdemeTablosu
            odemeler={gorunenler}
            ogrenciler={ogrenciler}
            bugun={bugun}
          />
        </Card>
      )}
    </div>
  );
}
