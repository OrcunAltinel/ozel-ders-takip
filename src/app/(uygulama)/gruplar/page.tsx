import Link from "next/link";
import { PlusIcon, UsersIcon } from "lucide-react";
import { oturumGetir } from "@/lib/auth/oturum";
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
  const { supabase, kullanici } = await oturumGetir();

  const [{ data: gruplar }, { data: ogrenciler }] = await Promise.all([
    supabase
      .from("gruplar")
      .select("id, ad, aciklama, renk")
      .eq("hoca_id", kullanici.id)
      .is("arsivlendi_at", null)
      .order("ad"),
    supabase
      .from("ogrenciler")
      .select("grup_id")
      .eq("hoca_id", kullanici.id)
      .is("arsivlendi_at", null)
      .not("grup_id", "is", null),
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
                <CardContent className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UsersIcon className="size-4" />
                  {ogrenciSayilari.get(grup.id) ?? 0} öğrenci
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
