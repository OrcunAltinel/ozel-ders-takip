import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { kimlikGetir } from "@/lib/auth/oturum";
import { saatlikUcretGetir } from "@/lib/ayarlar";
import { paraFormatla } from "@/lib/para";
import { telefonFormatla } from "@/lib/telefon";
import { bugununTarihi } from "@/lib/zaman/istanbul";
import { HaftalikProgram } from "@/components/gruplar/haftalik-program";
import { GrupArsivleButonu } from "@/components/arsiv/grup-arsiv-butonlari";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { GrupFormuDialog } from "@/components/gruplar/grup-formu-dialog";
import { RenkNoktasi } from "@/components/gruplar/renk-noktasi";
import { GrubaOgrenciEkle } from "@/components/gruplar/gruba-ogrenci-ekle";
import { GruptanCikarButonu } from "@/components/gruplar/gruptan-cikar-butonu";
import { OgrenciUcretiDialog } from "@/components/gruplar/ogrenci-ucreti-dialog";
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
  const { supabase, kullanici } = await kimlikGetir();

  const { data: grup } = await supabase
    .from("gruplar")
    .select("id, ad, aciklama, renk, saatlik_ucret")
    .eq("id", id)
    .eq("hoca_id", kullanici.id)
    .is("arsivlendi_at", null)
    .maybeSingle();

  if (!grup) notFound();

  // Hocanın tüm aktif öğrencileri: hem bu grubun üyeleri hem de
  // "Öğrenci ekle" listesindeki adaylar için kullanılır.
  const [{ data: ogrenciler }, { data: programlar }, varsayilanUcret] =
    await Promise.all([
      supabase
        .from("ogrenciler")
        .select("id, ad_soyad, telefon, grup_id, saatlik_ucret, gruplar(ad)")
        .eq("hoca_id", kullanici.id)
        .is("arsivlendi_at", null)
        .order("ad_soyad"),
      supabase
        .from("ders_programlari")
        .select(
          "id, haftanin_gunu, baslangic_saati, bitis_saati, baslangic_tarihi, bitis_tarihi",
        )
        .eq("grup_id", grup.id)
        .eq("hoca_id", kullanici.id)
        .order("haftanin_gunu")
        .order("baslangic_saati"),
      saatlikUcretGetir(),
    ]);
  const bugun = bugununTarihi();

  // Özel ücreti olmayan üyelere uygulanan ücret.
  const grupUcreti = grup.saatlik_ucret ?? varsayilanUcret;

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
          varsayilanUcret={varsayilanUcret}
          tetikleyici={
            <Button variant="outline">
              <PencilIcon />
              Düzenle
            </Button>
          }
        />
        <GrupArsivleButonu
          grupId={grup.id}
          grupAdi={grup.ad}
          ogrenciSayisi={uyeler.length}
          programSayisi={
            (programlar ?? []).filter(
              (p) => p.bitis_tarihi === null || p.bitis_tarihi >= bugun,
            ).length
          }
        />
        <GrubaOgrenciEkle grupId={grup.id} adaylar={adaylar} />
      </SayfaBasligi>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <RenkNoktasi renk={grup.renk} />
            {uyeler.length} öğrenci
            <span aria-hidden>·</span>
            Saatlik ücret:{" "}
            <span className="font-medium text-foreground">
              {grupUcreti === null ? "belirlenmedi" : paraFormatla(grupUcreti)}
            </span>
            {grup.saatlik_ucret === null && grupUcreti !== null
              ? "(varsayılan)"
              : null}
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
                    <TableHead>Saatlik ücret</TableHead>
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
                        {ogrenci.telefon
                          ? telefonFormatla(ogrenci.telefon)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <OgrenciUcretiDialog
                          grupId={grup.id}
                          ogrenciId={ogrenci.id}
                          ogrenciAdi={ogrenci.ad_soyad}
                          ozelUcret={ogrenci.saatlik_ucret}
                          grupUcreti={grupUcreti}
                        />
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
        </div>

        <HaftalikProgram
          grupId={grup.id}
          programlar={programlar ?? []}
          bugun={bugun}
        />
      </div>
    </>
  );
}
