import Link from "next/link";
import { WalletIcon } from "lucide-react";
import { kimlikGetir } from "@/lib/auth/oturum";
import { odemeOgrenciSecenekleri } from "@/lib/ogrenci-secenekleri";
import { paraFormatla } from "@/lib/para";
import { telefonFormatla } from "@/lib/telefon";
import { bugununTarihi } from "@/lib/zaman/istanbul";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { RenkNoktasi } from "@/components/gruplar/renk-noktasi";
import { OdemeFormuDialog } from "@/components/odemeler/odeme-formu-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function BorclarSayfasi() {
  const { supabase, kullanici } = await kimlikGetir();
  const bugun = bugununTarihi();

  const [{ data: ogrenciler }, { data: bakiyeler }, secenekler] =
    await Promise.all([
      supabase
        .from("ogrenciler")
        .select(
          "id, ad_soyad, telefon, veli_ad, veli_telefon, arsivlendi_at, gruplar(ad, renk)",
        )
        .eq("hoca_id", kullanici.id),
      supabase
        .from("ogrenci_bakiyeleri")
        .select("ogrenci_id, bakiye, toplam_odeme")
        .eq("hoca_id", kullanici.id)
        .neq("bakiye", 0),
      odemeOgrenciSecenekleri(),
    ]);

  const ogrenciHaritasi = new Map((ogrenciler ?? []).map((o) => [o.id, o]));
  const satirlar = (bakiyeler ?? [])
    .flatMap((b) => {
      const o = b.ogrenci_id ? ogrenciHaritasi.get(b.ogrenci_id) : undefined;
      return o ? [{ ...o, bakiye: b.bakiye ?? 0 }] : [];
    })
    .sort((a, b) => b.bakiye - a.bakiye);

  const borclular = satirlar.filter((s) => s.bakiye > 0);
  const alacaklilar = satirlar.filter((s) => s.bakiye < 0);
  const toplamBorc = borclular.reduce((t, s) => t + s.bakiye, 0);

  return (
    <>
      <SayfaBasligi
        baslik="Borçlar"
        aciklama="Gelinen derslerin ücreti ile yapılan ödemeler arasındaki fark."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Toplam alacağınız
            </div>
            <div className="text-2xl font-semibold text-destructive tabular-nums">
              {paraFormatla(toplamBorc)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">Borçlu öğrenci</div>
            <div className="text-2xl font-semibold tabular-nums">
              {borclular.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {borclular.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Borçlu öğrenci yok. 🎉
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Öğrenci</TableHead>
                <TableHead className="hidden sm:table-cell">Grup</TableHead>
                <TableHead className="hidden md:table-cell">İletişim</TableHead>
                <TableHead className="text-right">Borç</TableHead>
                <TableHead className="w-0 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {borclular.map((s) => {
                const iletisim = s.veli_telefon ?? s.telefon;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="pl-4 font-medium">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/ogrenciler/${s.id}`}
                          className="hover:underline"
                        >
                          {s.ad_soyad}
                        </Link>
                        {s.arsivlendi_at ? (
                          <Badge variant="outline">Arşivde</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {s.gruplar ? (
                        <span className="inline-flex items-center gap-1.5">
                          <RenkNoktasi renk={s.gruplar.renk} />
                          {s.gruplar.ad}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Grupsuz</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {iletisim ? (
                        <span className="text-sm">
                          {s.veli_telefon && s.veli_ad
                            ? `${s.veli_ad}: `
                            : null}
                          {telefonFormatla(iletisim)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive tabular-nums">
                      {paraFormatla(s.bakiye)}
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-1">
                        <OdemeFormuDialog
                          ogrenciler={secenekler}
                          bugun={bugun}
                          varsayilanOgrenciId={s.id}
                          tetikleyici={
                            <Button variant="outline" size="sm">
                              <WalletIcon />
                              Ödeme al
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {alacaklilar.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Fazla ödeme yapanlar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1 text-sm">
              {alacaklilar.map((s) => (
                <li key={s.id} className="flex justify-between gap-2">
                  <Link
                    href={`/ogrenciler/${s.id}`}
                    className="hover:underline"
                  >
                    {s.ad_soyad}
                  </Link>
                  <span className="text-emerald-600 tabular-nums">
                    {paraFormatla(-s.bakiye)} alacaklı
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
