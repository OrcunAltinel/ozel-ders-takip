import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { kimlikGetir } from "@/lib/auth/oturum";
import { saatlikUcretGetir } from "@/lib/ayarlar";
import { paraFormatla } from "@/lib/para";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { OgrenciFormuDialog } from "@/components/ogrenciler/ogrenci-formu-dialog";
import {
  OgrenciTablosu,
  type OgrenciSatiri,
} from "@/components/ogrenciler/ogrenci-tablosu";
import { Button } from "@/components/ui/button";

export default async function OgrencilerSayfasi() {
  const { supabase, kullanici } = await kimlikGetir();

  const [
    { data: ogrenciler },
    { data: gruplar },
    { data: bakiyeler },
    saatlikUcret,
  ] = await Promise.all([
      supabase
        .from("ogrenciler")
        .select(
          "id, ad_soyad, telefon, veli_telefon, gruplar(id, ad, renk)",
        )
        .eq("hoca_id", kullanici.id)
        .is("arsivlendi_at", null)
        .order("ad_soyad"),
      supabase
        .from("gruplar")
        .select("id, ad")
        .eq("hoca_id", kullanici.id)
        .is("arsivlendi_at", null)
        .order("ad"),
      supabase
        .from("ogrenci_bakiyeleri")
        .select("ogrenci_id, bakiye")
        .eq("hoca_id", kullanici.id),
      saatlikUcretGetir(),
    ]);

  const bakiyeHaritasi = new Map(
    (bakiyeler ?? []).map((b) => [b.ogrenci_id, b.bakiye ?? 0]),
  );

  const satirlar: OgrenciSatiri[] = (ogrenciler ?? []).map((o) => ({
    id: o.id,
    adSoyad: o.ad_soyad,
    telefon: o.telefon,
    veliTelefon: o.veli_telefon,
    grup: o.gruplar,
    bakiye: bakiyeHaritasi.get(o.id) ?? 0,
  }));

  return (
    <>
      <SayfaBasligi
        baslik="Öğrenciler"
        aciklama={`${satirlar.length} aktif öğrenci`}
      >
        <OgrenciFormuDialog
          gruplar={gruplar ?? []}
          tetikleyici={
            <Button>
              <PlusIcon />
              Yeni öğrenci
            </Button>
          }
        />
      </SayfaBasligi>

      {saatlikUcret === null ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          Varsayılan saatlik ücret henüz belirlenmedi. Grup veya öğrenci ücreti
          olmayan derslerde yoklama alabilmek için{" "}
          <Link href="/ayarlar" className="font-medium underline">
            Ayarlar
          </Link>{" "}
          sayfasından saatlik ücreti girin.
        </p>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">
          Varsayılan saatlik ücret:{" "}
          <span className="font-medium text-foreground">
            {paraFormatla(saatlikUcret)}
          </span>{" "}
          (grup veya öğrenciye özel ücret yoksa,{" "}
          <Link href="/ayarlar" className="underline hover:text-foreground">
            değiştir
          </Link>
          )
        </p>
      )}

      <OgrenciTablosu ogrenciler={satirlar} gruplar={gruplar ?? []} />
    </>
  );
}
