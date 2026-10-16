import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { oturumGetir } from "@/lib/auth/oturum";
import { telefonFormatla } from "@/lib/telefon";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { GrupFormuDialog } from "@/components/gruplar/grup-formu-dialog";
import { RenkNoktasi } from "@/components/gruplar/renk-noktasi";
import { GrubaOgrenciEkle } from "@/components/gruplar/gruba-ogrenci-ekle";
import { GruptanCikarButonu } from "@/components/gruplar/gruptan-cikar-butonu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function GrupDetaySayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, kullanici } = await oturumGetir();

  const { data: grup } = await supabase
    .from("gruplar")
    .select("id, ad, aciklama, renk")
    .eq("id", id)
    .eq("hoca_id", kullanici.id)
    .is("arsivlendi_at", null)
    .maybeSingle();

  if (!grup) notFound();

  // Hocanın tüm aktif öğrencileri: hem bu grubun üyeleri hem de
  // "Öğrenci ekle" listesindeki adaylar için kullanılır.
  const { data: ogrenciler } = await supabase
    .from("ogrenciler")
    .select("id, ad_soyad, telefon, grup_id, gruplar(ad)")
    .eq("hoca_id", kullanici.id)
    .is("arsivlendi_at", null)
    .order("ad_soyad");

  const uyeler = (ogrenciler ?? []).filter((o) => o.grup_id === grup.id);
  const adaylar = (ogrenciler ?? [])
    .filter((o) => o.grup_id !== grup.id)
    .map((o) => ({
      id: o.id,
      adSoyad: o.ad_soyad,
      mevcutGrup: o.gruplar?.ad ?? null,
    }));

  return (
    <>
      <Link
        href="/gruplar"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Gruplar
      </Link>

      <SayfaBasligi baslik={grup.ad} aciklama={grup.aciklama ?? undefined}>
        <GrupFormuDialog
          grup={grup}
          tetikleyici={
            <Button variant="outline">
              <PencilIcon />
              Düzenle
            </Button>
          }
        />
        <GrubaOgrenciEkle grupId={grup.id} adaylar={adaylar} />
      </SayfaBasligi>

      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <RenkNoktasi renk={grup.renk} />
        {uyeler.length} öğrenci
      </div>

      {uyeler.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Bu grupta henüz öğrenci yok.
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Ad Soyad</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead className="w-0 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {uyeler.map((ogrenci) => (
                <TableRow key={ogrenci.id}>
                  <TableCell className="pl-4 font-medium">
                    <Link
                      href={`/ogrenciler/${ogrenci.id}`}
                      className="hover:underline"
                    >
                      {ogrenci.ad_soyad}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {ogrenci.telefon ? telefonFormatla(ogrenci.telefon) : "—"}
                  </TableCell>
                  <TableCell className="pr-4">
                    <GruptanCikarButonu
                      grupId={grup.id}
                      ogrenciId={ogrenci.id}
                      ogrenciAdi={ogrenci.ad_soyad}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
