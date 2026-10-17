import Link from "next/link";
import { ClockIcon } from "lucide-react";
import { cn } from "cn";
import type { YoklamaDersi } from "@/lib/yoklama-verisi";
import { kisaTarihFormatla } from "@/lib/zaman/istanbul";
import { saatFarkiSaat } from "@/lib/zaman/saat";
import { RenkNoktasi } from "@/components/gruplar/renk-noktasi";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { YoklamaFormu } from "./yoklama-formu";

export function DersYoklamaKarti({
  ders,
  saatlikUcret,
  bugun,
  tarihiGoster = false,
}: {
  ders: YoklamaDersi;
  saatlikUcret: number | null;
  bugun: string;
  tarihiGoster?: boolean;
}) {
  const iptal = ders.durum === "iptal";
  const gelecek = ders.tarih > bugun;
  // Bu dersin ücreti = saatlik ücret × ders süresi (saat).
  const buDersinUcreti =
    saatlikUcret === null
      ? null
      : Math.round(
          saatlikUcret *
            saatFarkiSaat(ders.baslangicSaati, ders.bitisSaati) *
            100,
        ) / 100;
  // Satırlar değişince (yeni öğrenci, kaydedilen yoklama) form baştan kurulsun.
  const formAnahtari = ders.satirlar
    .map((s) => `${s.ogrenciId}:${s.durum ?? "-"}`)
    .join("|");

  return (
    <Card className={cn(iptal && "opacity-60")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RenkNoktasi renk={ders.grup.renk} className="size-3" />
          <Link href={`/gruplar/${ders.grup.id}`} className="hover:underline">
            {ders.grup.ad}
          </Link>
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3.5" />
            {tarihiGoster ? `${kisaTarihFormatla(ders.tarih)}, ` : null}
            {ders.baslangicSaati}–{ders.bitisSaati}
          </span>
          {ders.konu ? <span>· {ders.konu}</span> : null}
        </CardDescription>
        <CardAction>
          {iptal ? (
            <Badge variant="destructive">İptal</Badge>
          ) : ders.yoklamaAlindi ? (
            <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
              Yoklama alındı
            </Badge>
          ) : (
            <Badge variant="secondary">Yoklama bekliyor</Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        {iptal ? (
          <p className="text-sm text-muted-foreground">
            Bu ders iptal edildi. Yoklama almak için önce takvimden iptali geri
            alın.
          </p>
        ) : gelecek ? (
          <p className="text-sm text-muted-foreground">
            Yoklama, ders günü geldiğinde alınabilir.
          </p>
        ) : (
          <YoklamaFormu
            key={formAnahtari}
            dersId={ders.id}
            satirlar={ders.satirlar}
            yoklamaAlindi={ders.yoklamaAlindi}
            buDersinUcreti={buDersinUcreti}
          />
        )}
      </CardContent>
    </Card>
  );
}
