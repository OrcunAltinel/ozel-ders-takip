import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, EyeIcon } from "lucide-react";
import { z } from "zod";
import { cn } from "cn";
import { yoneticiSayfasi } from "@/lib/auth/yonetici";
import { paraFormatla } from "@/lib/para";
import { ODEME_YONTEMLERI, type OdemeYontemi } from "@/lib/validasyon/odeme";
import { ROLLER, type Rol } from "@/lib/validasyon/yonetim";
import { bugununTarihi, kisaTarihFormatla } from "@/lib/zaman/istanbul";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { RenkNoktasi } from "@/components/gruplar/renk-noktasi";
import { KullaniciIslemleri } from "@/components/yonetim/kullanici-islemleri";
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

function Ozet({ etiket, deger }: { etiket: string; deger: string | number }) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="text-xs text-muted-foreground">{etiket}</div>
        <div className="text-lg font-semibold tabular-nums">{deger}</div>
      </CardContent>
    </Card>
  );
}

/** Bir hocanın verilerinin salt okunur özeti (yalnızca yöneticiler). */
export default async function HocaDetaySayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase, kullanici } = await yoneticiSayfasi();

  const { data: profil } = await supabase
    .from("profiller")
    .select("id, kullanici_adi, ad_soyad, rol, aktif, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!profil) notFound();

  const bugun = bugununTarihi();
  const ayBasi = `${bugun.slice(0, 7)}-01`;

  const [
    { data: ogrenciler },
    { data: gruplar },
    { data: bakiyeler },
    { data: odemeler },
    { count: buAyDers },
    { data: ayar },
  ] = await Promise.all([
    supabase
      .from("ogrenciler")
      .select("id, ad_soyad, arsivlendi_at, gruplar(ad, renk)")
      .eq("hoca_id", id)
      .order("ad_soyad"),
    supabase
      .from("gruplar")
      .select("id, ad, renk, arsivlendi_at")
      .eq("hoca_id", id)
      .is("arsivlendi_at", null)
      .order("ad"),
    supabase
      .from("ogrenci_bakiyeleri")
      .select("ogrenci_id, bakiye")
      .eq("hoca_id", id),
    supabase
      .from("odemeler")
      .select("id, tutar, tarih, odeme_yontemi, ogrenciler(ad_soyad)")
      .eq("hoca_id", id)
      .order("tarih", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("dersler")
      .select("id", { count: "exact", head: true })
      .eq("hoca_id", id)
      .eq("durum", "yapildi")
      .gte("tarih", ayBasi)
      .lte("tarih", bugun),
    supabase
      .from("hoca_ayarlari")
      .select("saatlik_ucret")
      .eq("hoca_id", id)
      .maybeSingle(),
  ]);

  const bakiyeHaritasi = new Map(
    (bakiyeler ?? []).map((b) => [b.ogrenci_id, b.bakiye ?? 0]),
  );
  const aktifOgrenciler = (ogrenciler ?? []).filter((o) => !o.arsivlendi_at);
  const toplamAlacak = (bakiyeler ?? []).reduce(
    (t, b) => t + Math.max(b.bakiye ?? 0, 0),
    0,
  );
  const buAyTahsilat = (odemeler ?? [])
    .filter((o) => o.tarih >= ayBasi)
    .reduce((t, o) => t + o.tutar, 0);
  // Listede aktifler + bakiyesi olan arşivdekiler gösterilir.
  const listelenecekOgrenciler = (ogrenciler ?? []).filter(
    (o) => !o.arsivlendi_at || (bakiyeHaritasi.get(o.id) ?? 0) !== 0,
  );

  return (
    <>
      <Link
        href="/yonetim"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Yönetim
      </Link>

      <SayfaBasligi
        baslik={profil.ad_soyad}
        aciklama={`@${profil.kullanici_adi} · ${ROLLER[profil.rol as Rol]} · ${kisaTarihFormatla(profil.created_at)} tarihinde oluşturuldu`}
      >
        {profil.aktif ? null : <Badge variant="destructive">Pasif</Badge>}
        <KullaniciIslemleri
          kendisi={profil.id === kullanici.id}
          kullanici={{
            id: profil.id,
            kullaniciAdi: profil.kullanici_adi,
            adSoyad: profil.ad_soyad,
            rol: profil.rol as Rol,
            aktif: profil.aktif,
          }}
        />
      </SayfaBasligi>

      <p className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <EyeIcon className="size-4" />
        Salt okunur görünüm: bu hocanın verilerini değiştiremezsiniz.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Ozet etiket="Aktif öğrenci" deger={aktifOgrenciler.length} />
        <Ozet etiket="Aktif grup" deger={gruplar?.length ?? 0} />
        <Ozet etiket="Bu ay yapılan ders" deger={buAyDers ?? 0} />
        <Ozet etiket="Bu ay tahsilat" deger={paraFormatla(buAyTahsilat)} />
        <Ozet etiket="Toplam alacak" deger={paraFormatla(toplamAlacak)} />
        <Ozet
          etiket="Saatlik ücret"
          deger={ayar ? paraFormatla(ayar.saatlik_ucret) : "Belirlenmedi"}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card className="pb-0">
          <CardHeader>
            <CardTitle>Öğrenciler</CardTitle>
          </CardHeader>
          {listelenecekOgrenciler.length === 0 ? (
            <CardContent className="pb-4 text-sm text-muted-foreground">
              Öğrenci yok.
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Ad Soyad</TableHead>
                  <TableHead>Grup</TableHead>
                  <TableHead className="pr-4 text-right">Bakiye</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listelenecekOgrenciler.map((o) => {
                  const bakiye = bakiyeHaritasi.get(o.id) ?? 0;
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="pl-4 font-medium">
                        {o.ad_soyad}
                        {o.arsivlendi_at ? (
                          <Badge variant="outline" className="ml-1.5">
                            Arşivde
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {o.gruplar ? (
                          <span className="inline-flex items-center gap-1.5">
                            <RenkNoktasi renk={o.gruplar.renk} />
                            {o.gruplar.ad}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Grupsuz</span>
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "pr-4 text-right tabular-nums",
                          bakiye > 0 && "text-destructive",
                          bakiye < 0 && "text-emerald-600",
                        )}
                      >
                        {paraFormatla(Math.abs(bakiye))}
                        {bakiye > 0 ? " borç" : bakiye < 0 ? " alacak" : ""}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="pb-0">
          <CardHeader>
            <CardTitle>Son ödemeler</CardTitle>
          </CardHeader>
          {!odemeler?.length ? (
            <CardContent className="pb-4 text-sm text-muted-foreground">
              Ödeme yok.
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Tarih</TableHead>
                  <TableHead>Öğrenci</TableHead>
                  <TableHead className="hidden sm:table-cell">Yöntem</TableHead>
                  <TableHead className="pr-4 text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {odemeler.slice(0, 20).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-4 tabular-nums">
                      {kisaTarihFormatla(o.tarih)}
                    </TableCell>
                    <TableCell>{o.ogrenciler?.ad_soyad}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {ODEME_YONTEMLERI[o.odeme_yontemi as OdemeYontemi]}
                    </TableCell>
                    <TableCell className="pr-4 text-right tabular-nums">
                      {paraFormatla(o.tutar)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
