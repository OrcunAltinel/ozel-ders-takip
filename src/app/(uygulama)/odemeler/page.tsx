import Link from "next/link";
import { addMonths, endOfMonth, format, isValid, parse } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { oturumGetir } from "@/lib/auth/oturum";
import { odemeOgrenciSecenekleri } from "@/lib/ogrenci-secenekleri";
import { paraFormatla } from "@/lib/para";
import { ODEME_YONTEMLERI, type OdemeYontemi } from "@/lib/validasyon/odeme";
import { bugununTarihi } from "@/lib/zaman/istanbul";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { OdemeFormuDialog } from "@/components/odemeler/odeme-formu-dialog";
import {
  OdemeTablosu,
  type OdemeSatiri,
} from "@/components/odemeler/odeme-tablosu";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** "?ay=2026-10" parametresini ayın ilk gününe çevirir; geçersizse bu ay. */
function ayiCozumle(ay: string | undefined, bugun: string): Date {
  const varsayilan = parse(bugun.slice(0, 7), "yyyy-MM", new Date());
  if (!ay || !/^\d{4}-\d{2}$/.test(ay)) return varsayilan;
  const tarih = parse(ay, "yyyy-MM", new Date());
  return isValid(tarih) ? tarih : varsayilan;
}

export default async function OdemelerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ ay?: string }>;
}) {
  const { ay } = await searchParams;
  const { supabase, kullanici } = await oturumGetir();
  const bugun = bugununTarihi();

  const ayBasi = ayiCozumle(ay, bugun);
  const baslangic = format(ayBasi, "yyyy-MM-dd");
  const bitis = format(endOfMonth(ayBasi), "yyyy-MM-dd");
  const oncekiAy = format(addMonths(ayBasi, -1), "yyyy-MM");
  const sonrakiAy = format(addMonths(ayBasi, 1), "yyyy-MM");
  const buAyMi = bugun.slice(0, 7) === format(ayBasi, "yyyy-MM");

  const [{ data }, ogrenciler] = await Promise.all([
    supabase
      .from("odemeler")
      .select(
        "id, ogrenci_id, tutar, tarih, odeme_yontemi, aciklama, ogrenciler(ad_soyad)",
      )
      .eq("hoca_id", kullanici.id)
      .gte("tarih", baslangic)
      .lte("tarih", bitis)
      .order("tarih", { ascending: false })
      .order("created_at", { ascending: false }),
    odemeOgrenciSecenekleri(),
  ]);

  const odemeler: OdemeSatiri[] = (data ?? []).map((o) => ({
    id: o.id,
    ogrenciId: o.ogrenci_id,
    ogrenciAdi: o.ogrenciler?.ad_soyad ?? "",
    tutar: o.tutar,
    tarih: o.tarih,
    odemeYontemi: o.odeme_yontemi as OdemeYontemi,
    aciklama: o.aciklama,
  }));

  const toplam = odemeler.reduce((t, o) => t + o.tutar, 0);
  const yontemToplamlari = (Object.keys(ODEME_YONTEMLERI) as OdemeYontemi[])
    .map((y) => ({
      yontem: y,
      tutar: odemeler
        .filter((o) => o.odemeYontemi === y)
        .reduce((t, o) => t + o.tutar, 0),
    }))
    .filter((y) => y.tutar > 0);

  return (
    <>
      <SayfaBasligi baslik="Ödemeler">
        <OdemeFormuDialog
          ogrenciler={ogrenciler}
          bugun={bugun}
          tetikleyici={
            <Button>
              <PlusIcon />
              Ödeme al
            </Button>
          }
        />
      </SayfaBasligi>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link
            href={`/odemeler?ay=${oncekiAy}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
            aria-label="Önceki ay"
          >
            <ChevronLeftIcon />
          </Link>
          <span className="min-w-32 text-center font-medium capitalize">
            {format(ayBasi, "LLLL yyyy", { locale: tr })}
          </span>
          <Link
            href={`/odemeler?ay=${sonrakiAy}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
            aria-label="Sonraki ay"
          >
            <ChevronRightIcon />
          </Link>
          {!buAyMi ? (
            <Link
              href="/odemeler"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Bu ay
            </Link>
          ) : null}
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            {odemeler.length} ödeme, toplam
          </div>
          <div className="text-lg font-semibold tabular-nums">
            {paraFormatla(toplam)}
          </div>
          {yontemToplamlari.length > 1 ? (
            <div className="text-xs text-muted-foreground">
              {yontemToplamlari
                .map(
                  (y) =>
                    `${ODEME_YONTEMLERI[y.yontem]}: ${paraFormatla(y.tutar)}`,
                )
                .join(" · ")}
            </div>
          ) : null}
        </div>
      </div>

      {odemeler.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Bu ay kayıtlı ödeme yok.
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <OdemeTablosu
            odemeler={odemeler}
            ogrenciler={ogrenciler}
            bugun={bugun}
          />
        </Card>
      )}
    </>
  );
}
