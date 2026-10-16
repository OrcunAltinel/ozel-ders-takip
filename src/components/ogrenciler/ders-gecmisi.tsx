import Link from "next/link";
import { paraFormatla } from "@/lib/para";
import { kisaTarihFormatla } from "@/lib/zaman/istanbul";
import { saatKisalt } from "@/lib/zaman/saat";
import { RenkNoktasi } from "@/components/gruplar/renk-noktasi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DersGecmisiSatiri = {
  dersId: string;
  tarih: string;
  baslangicSaati: string;
  grupAdi: string;
  renk: string;
  durum: "geldi" | "gelmedi";
  ucret: number;
};

export function DersGecmisi({ satirlar }: { satirlar: DersGecmisiSatiri[] }) {
  const gelinen = satirlar.filter((s) => s.durum === "geldi").length;

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Ders geçmişi</CardTitle>
        {satirlar.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {satirlar.length} dersin {gelinen} tanesine geldi
          </p>
        ) : null}
      </CardHeader>
      {satirlar.length === 0 ? (
        <CardContent className="pb-4 text-sm text-muted-foreground">
          Henüz yoklaması alınmış ders yok.
        </CardContent>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Tarih</TableHead>
              <TableHead>Grup</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="pr-4 text-right">Ücret</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {satirlar.map((s) => (
              <TableRow key={s.dersId}>
                <TableCell className="pl-4 tabular-nums">
                  <Link
                    href={`/dersler/${s.dersId}`}
                    className="hover:underline"
                  >
                    {kisaTarihFormatla(s.tarih)}, {saatKisalt(s.baslangicSaati)}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    <RenkNoktasi renk={s.renk} />
                    {s.grupAdi}
                  </span>
                </TableCell>
                <TableCell>
                  {s.durum === "geldi" ? (
                    <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
                      Geldi
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Gelmedi</Badge>
                  )}
                </TableCell>
                <TableCell className="pr-4 text-right tabular-nums">
                  {s.durum === "geldi" ? (
                    paraFormatla(s.ucret)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
