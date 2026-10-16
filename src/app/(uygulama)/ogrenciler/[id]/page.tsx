import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { cn } from "cn";
import { oturumGetir } from "@/lib/auth/oturum";
import { paraFormatla } from "@/lib/para";
import { telefonFormatla } from "@/lib/telefon";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { RenkNoktasi } from "@/components/gruplar/renk-noktasi";
import { OgrenciFormuDialog } from "@/components/ogrenciler/ogrenci-formu-dialog";
import {
  DersGecmisi,
  type DersGecmisiSatiri,
} from "@/components/ogrenciler/ders-gecmisi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Bilgi({
  etiket,
  children,
}: {
  etiket: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiket}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function TelefonBaglantisi({ telefon }: { telefon: string | null }) {
  if (!telefon) return <span className="text-muted-foreground">—</span>;
  return (
    <a href={`tel:+90${telefon}`} className="hover:underline">
      {telefonFormatla(telefon)}
    </a>
  );
}

export default async function OgrenciDetaySayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, kullanici } = await oturumGetir();

  const { data: ogrenci } = await supabase
    .from("ogrenciler")
    .select(
      "id, ad_soyad, telefon, veli_ad, veli_telefon, grup_id, notlar, gruplar(id, ad, renk)",
    )
    .eq("id", id)
    .eq("hoca_id", kullanici.id)
    .is("arsivlendi_at", null)
    .maybeSingle();

  if (!ogrenci) notFound();

  const [{ data: gruplar }, { data: bakiye }, { data: yoklamalar }] =
    await Promise.all([
      supabase
        .from("gruplar")
        .select("id, ad")
        .eq("hoca_id", kullanici.id)
        .is("arsivlendi_at", null)
        .order("ad"),
      supabase
        .from("ogrenci_bakiyeleri")
        .select("toplam_tahakkuk, toplam_odeme, bakiye")
        .eq("ogrenci_id", ogrenci.id)
        .maybeSingle(),
      supabase
        .from("yoklamalar")
        .select(
          "durum, ucret, dersler(id, tarih, baslangic_saati, gruplar(ad, renk))",
        )
        .eq("ogrenci_id", ogrenci.id)
        .eq("hoca_id", kullanici.id),
    ]);

  const guncelBakiye = bakiye?.bakiye ?? 0;

  const dersGecmisi: DersGecmisiSatiri[] = (yoklamalar ?? [])
    .filter((y) => y.dersler)
    .map((y) => ({
      dersId: y.dersler!.id,
      tarih: y.dersler!.tarih,
      baslangicSaati: y.dersler!.baslangic_saati,
      grupAdi: y.dersler!.gruplar?.ad ?? "",
      renk: y.dersler!.gruplar?.renk ?? "#4b5563",
      durum: y.durum as DersGecmisiSatiri["durum"],
      ucret: y.ucret,
    }))
    .sort((a, b) =>
      `${b.tarih}${b.baslangicSaati}`.localeCompare(
        `${a.tarih}${a.baslangicSaati}`,
      ),
    );

  return (
    <>
      <Link
        href="/ogrenciler"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Öğrenciler
      </Link>

      <SayfaBasligi baslik={ogrenci.ad_soyad}>
        <OgrenciFormuDialog
          ogrenci={ogrenci}
          gruplar={gruplar ?? []}
          tetikleyici={
            <Button variant="outline">
              <PencilIcon />
              Düzenle
            </Button>
          }
        />
      </SayfaBasligi>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bilgiler</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Bilgi etiket="Grup">
                {ogrenci.gruplar ? (
                  <Link
                    href={`/gruplar/${ogrenci.gruplar.id}`}
                    className="inline-flex items-center gap-1.5 hover:underline"
                  >
                    <RenkNoktasi renk={ogrenci.gruplar.renk} />
                    {ogrenci.gruplar.ad}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Grupsuz</span>
                )}
              </Bilgi>
              <Bilgi etiket="Telefon">
                <TelefonBaglantisi telefon={ogrenci.telefon} />
              </Bilgi>
              <Bilgi etiket="Veli">
                {ogrenci.veli_ad ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </Bilgi>
              <Bilgi etiket="Veli telefonu">
                <TelefonBaglantisi telefon={ogrenci.veli_telefon} />
              </Bilgi>
              {ogrenci.notlar ? (
                <div className="sm:col-span-2">
                  <Bilgi etiket="Notlar">
                    <p className="whitespace-pre-wrap">{ogrenci.notlar}</p>
                  </Bilgi>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hesap</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Toplam ders ücreti</dt>
                <dd className="tabular-nums">
                  {paraFormatla(bakiye?.toplam_tahakkuk ?? 0)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Toplam ödeme</dt>
                <dd className="tabular-nums">
                  {paraFormatla(bakiye?.toplam_odeme ?? 0)}
                </dd>
              </div>
              <div className="flex justify-between border-t pt-3 font-medium">
                <dt>
                  {guncelBakiye > 0
                    ? "Borç"
                    : guncelBakiye < 0
                      ? "Alacak (fazla ödeme)"
                      : "Bakiye"}
                </dt>
                <dd
                  className={cn(
                    "tabular-nums",
                    guncelBakiye > 0 && "text-destructive",
                    guncelBakiye < 0 && "text-emerald-600",
                  )}
                >
                  {paraFormatla(Math.abs(guncelBakiye))}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <DersGecmisi satirlar={dersGecmisi} />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Ödeme geçmişi, ödeme ekranı eklendiğinde (Aşama 7) burada listelenecek.
      </p>
    </>
  );
}
