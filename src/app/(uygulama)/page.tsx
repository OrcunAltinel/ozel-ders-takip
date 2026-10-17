import Link from "next/link";
import { CalendarPlusIcon } from "lucide-react";
import { kimlikGetir } from "@/lib/auth/oturum";
import { saatlikUcretGetir } from "@/lib/ayarlar";
import { yoklamaDersleriniGetir } from "@/lib/yoklama-verisi";
import {
  bugununTarihi,
  kisaTarihFormatla,
  tarihFormatla,
} from "@/lib/zaman/istanbul";
import { saatKisalt, tariheGunEkle } from "@/lib/zaman/saat";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { DersYoklamaKarti } from "@/components/yoklama/ders-yoklama-karti";
import { RenkNoktasi } from "@/components/gruplar/renk-noktasi";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Yoklaması unutulmuş dersler için geriye dönük bakılan gün sayısı. */
const GERIYE_DONUK_GUN = 30;

export default async function BugunSayfasi() {
  const { supabase, kullanici } = await kimlikGetir();
  const bugun = bugununTarihi();
  const baslangic = tariheGunEkle(bugun, -GERIYE_DONUK_GUN);

  // Tekrarlayan programlardan bugünün ve son 30 günün eksik derslerini üret.
  await supabase.rpc("dersleri_uret", {
    p_baslangic: baslangic,
    p_bitis: bugun,
  });

  const [dersler, saatlikUcret, { data: bekleyenler }] = await Promise.all([
    yoklamaDersleriniGetir({ tur: "tarih", tarih: bugun }),
    saatlikUcretGetir(),
    supabase
      .from("dersler")
      .select("id, tarih, baslangic_saati, bitis_saati, gruplar(ad, renk)")
      .eq("hoca_id", kullanici.id)
      .eq("durum", "planli")
      .gte("tarih", baslangic)
      .lt("tarih", bugun)
      .order("tarih", { ascending: false })
      .order("baslangic_saati"),
  ]);

  const bekleyenSayisi = dersler.filter(
    (d) => d.durum !== "iptal" && !d.yoklamaAlindi,
  ).length;

  return (
    <>
      <SayfaBasligi
        baslik="Bugün"
        aciklama={`${tarihFormatla(bugun)} · ${dersler.length} ders${
          bekleyenSayisi ? `, ${bekleyenSayisi} yoklama bekliyor` : ""
        }`}
      />

      {saatlikUcret === null ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          Saatlik ücret henüz belirlenmedi; yoklama alabilmek için{" "}
          <Link href="/ayarlar" className="font-medium underline">
            Ayarlar
          </Link>{" "}
          sayfasından ücreti girin.
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {dersler.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
                Bugün planlanmış ders yok.
                <Link
                  href="/takvim"
                  className={buttonVariants({ variant: "outline" })}
                >
                  <CalendarPlusIcon />
                  Takvime git
                </Link>
              </CardContent>
            </Card>
          ) : (
            dersler.map((ders) => (
              <DersYoklamaKarti
                key={ders.id}
                ders={ders}
                saatlikUcret={saatlikUcret}
                bugun={bugun}
              />
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Yoklaması alınmamış dersler</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {!bekleyenler?.length ? (
              <p className="text-muted-foreground">
                Son {GERIYE_DONUK_GUN} günde yoklaması unutulan ders yok.
              </p>
            ) : (
              <ul className="-mx-2 flex flex-col">
                {bekleyenler.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/dersler/${d.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
                    >
                      <RenkNoktasi renk={d.gruplar?.renk ?? "#4b5563"} />
                      <span className="flex-1 truncate font-medium">
                        {d.gruplar?.ad}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {kisaTarihFormatla(d.tarih)},{" "}
                        {saatKisalt(d.baslangic_saati)}–
                        {saatKisalt(d.bitis_saati)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
