import Link from "next/link";
import { cn } from "cn";
import { oturumGetir } from "@/lib/auth/oturum";
import { paraFormatla } from "@/lib/para";
import { kisaTarihFormatla } from "@/lib/zaman/istanbul";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { RenkNoktasi } from "@/components/gruplar/renk-noktasi";
import {
  OgrenciArsivdenCikarButonu,
  OgrenciKaliciSilButonu,
} from "@/components/arsiv/ogrenci-arsiv-butonlari";
import {
  GrupArsivdenCikarButonu,
  GrupKaliciSilButonu,
} from "@/components/arsiv/grup-arsiv-butonlari";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function GecmisiVarNotu({ metin }: { metin: string }) {
  return (
    <span
      className="text-xs text-muted-foreground"
      title="Geçmişi olan kayıtlar kalıcı olarak silinemez."
    >
      {metin}
    </span>
  );
}

export default async function ArsivSayfasi() {
  const { supabase, kullanici } = await oturumGetir();

  const [{ data: ogrenciler }, { data: gruplar }, { data: bakiyeler }] =
    await Promise.all([
      supabase
        .from("ogrenciler")
        .select(
          "id, ad_soyad, arsivlendi_at, yoklamalar(count), odemeler(count)",
        )
        .eq("hoca_id", kullanici.id)
        .not("arsivlendi_at", "is", null)
        .order("arsivlendi_at", { ascending: false }),
      supabase
        .from("gruplar")
        .select("id, ad, renk, arsivlendi_at, dersler(count)")
        .eq("hoca_id", kullanici.id)
        .not("arsivlendi_at", "is", null)
        .order("arsivlendi_at", { ascending: false }),
      supabase
        .from("ogrenci_bakiyeleri")
        .select("ogrenci_id, bakiye")
        .eq("hoca_id", kullanici.id)
        .neq("bakiye", 0),
    ]);

  const bakiyeHaritasi = new Map(
    (bakiyeler ?? []).map((b) => [b.ogrenci_id, b.bakiye ?? 0]),
  );

  return (
    <>
      <SayfaBasligi
        baslik="Arşiv"
        aciklama="Arşivlenen kayıtlar geri alınabilir. Ders veya ödeme geçmişi olmayan kayıtlar kalıcı olarak silinebilir."
      />

      <div className="flex flex-col gap-6">
        <Card className="pb-0">
          <CardHeader>
            <CardTitle>Öğrenciler ({ogrenciler?.length ?? 0})</CardTitle>
          </CardHeader>
          {!ogrenciler?.length ? (
            <CardContent className="pb-4 text-sm text-muted-foreground">
              Arşivde öğrenci yok.
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Ad Soyad</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Arşivlenme
                  </TableHead>
                  <TableHead className="text-right">Bakiye</TableHead>
                  <TableHead className="pr-4 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ogrenciler.map((o) => {
                  const bakiye = bakiyeHaritasi.get(o.id) ?? 0;
                  const gecmisVar =
                    (o.yoklamalar[0]?.count ?? 0) > 0 ||
                    (o.odemeler[0]?.count ?? 0) > 0;
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="pl-4 font-medium">
                        <Link
                          href={`/ogrenciler/${o.id}`}
                          className="hover:underline"
                        >
                          {o.ad_soyad}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {kisaTarihFormatla(o.arsivlendi_at!)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          bakiye > 0 && "text-destructive",
                          bakiye < 0 && "text-emerald-600",
                        )}
                      >
                        {bakiye === 0
                          ? "—"
                          : `${paraFormatla(Math.abs(bakiye))} ${bakiye > 0 ? "borç" : "alacak"}`}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <OgrenciArsivdenCikarButonu
                            ogrenciId={o.id}
                            boyut="sm"
                          />
                          {gecmisVar ? (
                            <GecmisiVarNotu metin="Geçmişi var" />
                          ) : (
                            <OgrenciKaliciSilButonu
                              ogrenciId={o.id}
                              adSoyad={o.ad_soyad}
                              boyut="sm"
                            />
                          )}
                        </div>
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
            <CardTitle>Gruplar ({gruplar?.length ?? 0})</CardTitle>
          </CardHeader>
          {!gruplar?.length ? (
            <CardContent className="pb-4 text-sm text-muted-foreground">
              Arşivde grup yok.
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Grup</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Arşivlenme
                  </TableHead>
                  <TableHead className="text-right">Ders</TableHead>
                  <TableHead className="pr-4 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gruplar.map((g) => {
                  const dersSayisi = g.dersler[0]?.count ?? 0;
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="pl-4 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <RenkNoktasi renk={g.renk} />
                          {g.ad}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {kisaTarihFormatla(g.arsivlendi_at!)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {dersSayisi}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <GrupArsivdenCikarButonu grupId={g.id} />
                          {dersSayisi > 0 ? (
                            <GecmisiVarNotu metin="Ders geçmişi var" />
                          ) : (
                            <GrupKaliciSilButonu grupId={g.id} grupAdi={g.ad} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
