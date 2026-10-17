import Link from "next/link";
import { yoneticiSayfasi } from "@/lib/auth/yonetici";
import { paraFormatla } from "@/lib/para";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLLER, type Rol } from "@/lib/validasyon/yonetim";
import { kisaTarihFormatla, saatFormatla } from "@/lib/zaman/istanbul";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { KullaniciOlusturDialog } from "@/components/yonetim/kullanici-olustur-dialog";
import { KullaniciIslemleri } from "@/components/yonetim/kullanici-islemleri";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function YonetimSayfasi() {
  const { supabase, kullanici } = await yoneticiSayfasi();

  // Yönetici RLS ile tüm satırları salt okunur görebilir.
  const [{ data: profiller }, { data: ogrenciler }, { data: bakiyeler }, auth] =
    await Promise.all([
      supabase
        .from("profiller")
        .select("id, kullanici_adi, ad_soyad, rol, aktif, created_at")
        .order("created_at"),
      supabase.from("ogrenciler").select("hoca_id").is("arsivlendi_at", null),
      supabase
        .from("ogrenci_bakiyeleri")
        .select("hoca_id, bakiye")
        .gt("bakiye", 0),
      // Son giriş zamanı yalnızca Auth'ta tutulur (service role gerekir).
      createAdminClient().auth.admin.listUsers({ perPage: 1000 }),
    ]);

  const ogrenciSayilari = new Map<string, number>();
  for (const o of ogrenciler ?? []) {
    ogrenciSayilari.set(o.hoca_id, (ogrenciSayilari.get(o.hoca_id) ?? 0) + 1);
  }
  const alacaklar = new Map<string, number>();
  for (const b of bakiyeler ?? []) {
    if (b.hoca_id) {
      alacaklar.set(
        b.hoca_id,
        (alacaklar.get(b.hoca_id) ?? 0) + (b.bakiye ?? 0),
      );
    }
  }
  const sonGirisler = new Map(
    (auth.data?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null]),
  );

  return (
    <>
      <SayfaBasligi
        baslik="Yönetim"
        aciklama="Hesapları yönetin; hocaların verilerini salt okunur inceleyin."
      >
        <KullaniciOlusturDialog />
      </SayfaBasligi>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Ad Soyad</TableHead>
              <TableHead>Kullanıcı adı</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="hidden text-right md:table-cell">
                Öğrenci
              </TableHead>
              <TableHead className="hidden text-right md:table-cell">
                Alacak
              </TableHead>
              <TableHead className="hidden lg:table-cell">Son giriş</TableHead>
              <TableHead className="w-0 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(profiller ?? []).map((p) => {
              const sonGiris = sonGirisler.get(p.id);
              return (
                <TableRow
                  key={p.id}
                  className={p.aktif ? undefined : "opacity-60"}
                >
                  <TableCell className="pl-4 font-medium">
                    <Link href={`/yonetim/${p.id}`} className="hover:underline">
                      {p.ad_soyad}
                    </Link>
                    {p.id === kullanici.id ? (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        (siz)
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    @{p.kullanici_adi}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.rol === "yonetici" ? (
                        <Badge variant="outline">{ROLLER.yonetici}</Badge>
                      ) : null}
                      {p.aktif ? (
                        <Badge variant="secondary">Aktif</Badge>
                      ) : (
                        <Badge variant="destructive">Pasif</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {ogrenciSayilari.get(p.id) ?? 0}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {paraFormatla(alacaklar.get(p.id) ?? 0)}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {sonGiris
                      ? `${kisaTarihFormatla(sonGiris)}, ${saatFormatla(sonGiris)}`
                      : "Hiç giriş yapmadı"}
                  </TableCell>
                  <TableCell className="pr-4">
                    <KullaniciIslemleri
                      kendisi={p.id === kullanici.id}
                      kullanici={{
                        id: p.id,
                        kullaniciAdi: p.kullanici_adi,
                        adSoyad: p.ad_soyad,
                        rol: p.rol as Rol,
                        aktif: p.aktif,
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
