import Link from "next/link";
import { BanknoteIcon, PlusIcon, UsersIcon } from "lucide-react";
import { kimlikGetir } from "@/lib/auth/oturum";
import { saatlikUcretGetir } from "@/lib/ayarlar";
import { paraFormatla } from "@/lib/para";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { GrupFormuDialog } from "@/components/gruplar/grup-formu-dialog";
import { RenkNoktasi } from "@/components/gruplar/renk-noktasi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function GruplarSayfasi() {
  const { supabase, kullanici } = await kimlikGetir();

  const [{ data: gruplar }, { data: ogrenciler }, varsayilanUcret] =
    await Promise.all([
      supabase
        .from("gruplar")
        .select("id, ad, aciklama, renk, saatlik_ucret")
        .eq("hoca_id", kullanici.id)
        .is("arsivlendi_at", null)
        .order("ad"),
      supabase
        .from("ogrenciler")
        .select("grup_id")
        .eq("hoca_id", kullanici.id)
        .is("arsivlendi_at", null)
        .not("grup_id", "is", null),
      saatlikUcretGetir(),
    ]);

  const ogrenciSayilari = new Map<string, number>();
  for (const { grup_id } of ogrenciler ?? []) {
    if (grup_id) {
      ogrenciSayilari.set(grup_id, (ogrenciSayilari.get(grup_id) ?? 0) + 1);
    }
  }

  return (
    <>
      <SayfaBasligi
        baslik="Gruplar"
        aciklama="Dersler gruplar üzerinden planlanır. Tek öğrencili özel dersler için de bir grup oluşturun."
      >
        <GrupFormuDialog
          varsayilanUcret={varsayilanUcret}
          tetikleyici={
            <Button>
              <PlusIcon />
              Yeni grup
            </Button>
          }
        />
      </SayfaBasligi>

      {!gruplar?.length ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Henüz grup yok. &quot;Yeni grup&quot; ile ilk grubunuzu oluşturun.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {gruplar.map((grup) => (
            <Link
              key={grup.id}
              href={`/gruplar/${grup.id}`}
              className="rounded-xl transition hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RenkNoktasi renk={grup.renk} />
                    {grup.ad}
                  </CardTitle>
                  {grup.aciklama ? (
                    <CardDescription className="line-clamp-2">
                      {grup.aciklama}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <UsersIcon className="size-4" />
                    {ogrenciSayilari.get(grup.id) ?? 0} öğrenci
                  </span>
                  {grup.saatlik_ucret !== null ? (
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <BanknoteIcon className="size-4" />
                      {paraFormatla(grup.saatlik_ucret)}/saat
                    </span>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
