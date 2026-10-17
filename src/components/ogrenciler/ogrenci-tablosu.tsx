"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { cn } from "cn";
import { paraFormatla } from "@/lib/para";
import { telefonFormatla } from "@/lib/telefon";
import { RenkNoktasi } from "@/components/gruplar/renk-noktasi";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type OgrenciSatiri = {
  id: string;
  adSoyad: string;
  telefon: string | null;
  veliTelefon: string | null;
  grup: { id: string; ad: string; renk: string } | null;
  bakiye: number;
};

const TUMU = "__tumu__";
const GRUPSUZ = "__grupsuz__";

/** Türkçe karakterleri de doğru küçülterek aramayı büyük/küçük harf duyarsız yapar. */
function normallestir(metin: string): string {
  return metin.toLocaleLowerCase("tr-TR");
}

export function OgrenciTablosu({
  ogrenciler,
  gruplar,
}: {
  ogrenciler: OgrenciSatiri[];
  gruplar: { id: string; ad: string }[];
}) {
  const searchParams = useSearchParams();
  const [arama, setArama] = useState(() => searchParams.get("ara") ?? "");
  const [grupFiltresi, setGrupFiltresi] = useState<string>(
    () => searchParams.get("grup") ?? TUMU,
  );

  // Arama ve grup filtresini URL'ye yansıtır (paylaşılabilir/derin bağlantı).
  // Filtreleme tamamen istemci tarafında olduğundan, sunucu bileşenini
  // yeniden çalıştırmamak için History API kullanılır (router.replace değil).
  const urlGuncelle = useCallback((yeniArama: string, yeniGrup: string) => {
    const params = new URLSearchParams();
    if (yeniArama.trim()) params.set("ara", yeniArama.trim());
    if (yeniGrup !== TUMU) params.set("grup", yeniGrup);
    const sorgu = params.toString();
    window.history.replaceState(
      null,
      "",
      sorgu ? `?${sorgu}` : window.location.pathname,
    );
  }, []);

  const filtreOgeleri = [
    { value: TUMU, label: "Tüm gruplar" },
    { value: GRUPSUZ, label: "Grupsuz" },
    ...gruplar.map((g) => ({ value: g.id, label: g.ad })),
  ];

  const gorunenler = useMemo(() => {
    const aranan = normallestir(arama.trim());
    const aranayanRakamlar = arama.replace(/\D/g, "");

    return ogrenciler.filter((o) => {
      if (grupFiltresi === GRUPSUZ && o.grup) return false;
      if (
        grupFiltresi !== TUMU &&
        grupFiltresi !== GRUPSUZ &&
        o.grup?.id !== grupFiltresi
      ) {
        return false;
      }
      if (!aranan) return true;
      if (normallestir(o.adSoyad).includes(aranan)) return true;
      // Telefon numarasıyla da aranabilsin (en az 3 rakam yazılmışsa).
      if (aranayanRakamlar.length >= 3) {
        return [o.telefon, o.veliTelefon].some((t) =>
          t?.includes(aranayanRakamlar.replace(/^0/, "")),
        );
      }
      return false;
    });
  }, [ogrenciler, arama, grupFiltresi]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={arama}
            onChange={(e) => {
              setArama(e.target.value);
              urlGuncelle(e.target.value, grupFiltresi);
            }}
            placeholder="Ad veya telefon ara"
            className="pl-8"
            aria-label="Öğrenci ara"
          />
        </div>
        <Select
          items={filtreOgeleri}
          value={grupFiltresi}
          onValueChange={(deger) => {
            const yeni = deger ?? TUMU;
            setGrupFiltresi(yeni);
            urlGuncelle(arama, yeni);
          }}
        >
          <SelectTrigger className="min-w-40" aria-label="Gruba göre filtrele">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filtreOgeleri.map((oge) => (
              <SelectItem key={oge.value} value={oge.value}>
                {oge.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {gorunenler.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            {ogrenciler.length === 0
              ? 'Henüz öğrenci yok. "Yeni öğrenci" ile ilk öğrencinizi ekleyin.'
              : "Aramanızla eşleşen öğrenci bulunamadı."}
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Ad Soyad</TableHead>
                <TableHead>Grup</TableHead>
                <TableHead className="hidden sm:table-cell">Telefon</TableHead>
                <TableHead className="pr-4 text-right">Bakiye</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gorunenler.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="pl-4 font-medium">
                    <Link
                      href={`/ogrenciler/${o.id}`}
                      className="hover:underline"
                    >
                      {o.adSoyad}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {o.grup ? (
                      <span className="inline-flex items-center gap-1.5">
                        <RenkNoktasi renk={o.grup.renk} />
                        {o.grup.ad}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Grupsuz</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {o.telefon ? telefonFormatla(o.telefon) : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "pr-4 text-right tabular-nums",
                      o.bakiye > 0 && "font-medium text-destructive",
                      o.bakiye < 0 && "text-emerald-600",
                    )}
                  >
                    {paraFormatla(Math.abs(o.bakiye))}
                    {o.bakiye > 0 ? " borç" : o.bakiye < 0 ? " alacak" : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
