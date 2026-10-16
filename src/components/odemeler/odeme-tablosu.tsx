import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { paraFormatla } from "@/lib/para";
import type { OgrenciSecenegi } from "@/lib/ogrenci-secenekleri";
import { ODEME_YONTEMLERI, type OdemeYontemi } from "@/lib/validasyon/odeme";
import { kisaTarihFormatla } from "@/lib/zaman/istanbul";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OdemeFormuDialog } from "./odeme-formu-dialog";
import { OdemeSilButonu } from "./odeme-sil-butonu";

export type OdemeSatiri = {
  id: string;
  ogrenciId: string;
  ogrenciAdi: string;
  tutar: number;
  tarih: string;
  odemeYontemi: OdemeYontemi;
  aciklama: string | null;
};

export function OdemeTablosu({
  odemeler,
  ogrenciler,
  bugun,
  ogrenciKolonu = true,
}: {
  odemeler: OdemeSatiri[];
  ogrenciler: OgrenciSecenegi[];
  bugun: string;
  ogrenciKolonu?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Tarih</TableHead>
          {ogrenciKolonu ? <TableHead>Öğrenci</TableHead> : null}
          <TableHead className="hidden sm:table-cell">Yöntem</TableHead>
          <TableHead className="hidden md:table-cell">Açıklama</TableHead>
          <TableHead className="text-right">Tutar</TableHead>
          <TableHead className="w-0 pr-4" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {odemeler.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="pl-4 tabular-nums">
              {kisaTarihFormatla(o.tarih)}
            </TableCell>
            {ogrenciKolonu ? (
              <TableCell className="font-medium">
                <Link
                  href={`/ogrenciler/${o.ogrenciId}`}
                  className="hover:underline"
                >
                  {o.ogrenciAdi}
                </Link>
              </TableCell>
            ) : null}
            <TableCell className="hidden sm:table-cell">
              {ODEME_YONTEMLERI[o.odemeYontemi]}
            </TableCell>
            <TableCell className="hidden max-w-60 truncate text-muted-foreground md:table-cell">
              {o.aciklama ?? "—"}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {paraFormatla(o.tutar)}
            </TableCell>
            <TableCell className="pr-4">
              <div className="flex justify-end">
                <OdemeFormuDialog
                  ogrenciler={ogrenciler}
                  bugun={bugun}
                  odeme={o}
                  tetikleyici={
                    <Button variant="ghost" size="icon-sm">
                      <PencilIcon />
                      <span className="sr-only">Ödemeyi düzenle</span>
                    </Button>
                  }
                />
                <OdemeSilButonu
                  odemeId={o.id}
                  ozet={`${o.ogrenciAdi} · ${paraFormatla(o.tutar)} · ${kisaTarihFormatla(o.tarih)}`}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
