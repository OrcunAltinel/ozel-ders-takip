import { PencilIcon, PlusIcon, RepeatIcon } from "lucide-react";
import { haftaninGunuAdi, kisaTarihFormatla } from "@/lib/zaman/istanbul";
import { saatKisalt } from "@/lib/zaman/saat";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ProgramFormuDialog,
  type DuzenlenecekProgram,
} from "./program-formu-dialog";
import { ProgramSonlandirDialog } from "./program-sonlandir-dialog";

type ProgramSatiri = {
  id: string;
  haftanin_gunu: number;
  baslangic_saati: string;
  bitis_saati: string;
  baslangic_tarihi: string;
  bitis_tarihi: string | null;
};

export function HaftalikProgram({
  grupId,
  programlar,
  bugun,
}: {
  grupId: string;
  programlar: ProgramSatiri[];
  bugun: string;
}) {
  const aktifler = programlar.filter(
    (p) => p.bitis_tarihi === null || p.bitis_tarihi >= bugun,
  );
  const bitenler = programlar.filter(
    (p) => p.bitis_tarihi !== null && p.bitis_tarihi < bugun,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RepeatIcon className="size-4" />
          Haftalık program
        </CardTitle>
        <CardAction>
          <ProgramFormuDialog
            grupId={grupId}
            bugun={bugun}
            tetikleyici={
              <Button variant="outline" size="sm">
                <PlusIcon />
                Ekle
              </Button>
            }
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        {aktifler.length === 0 ? (
          <p className="text-muted-foreground">
            Tekrarlayan ders yok. Her hafta aynı gün ve saatte yapılan dersler
            için program ekleyin.
          </p>
        ) : (
          aktifler.map((p) => {
            const saat = `${saatKisalt(p.baslangic_saati)}–${saatKisalt(p.bitis_saati)}`;
            const program: DuzenlenecekProgram = {
              id: p.id,
              haftaninGunu: p.haftanin_gunu,
              baslangicSaati: saatKisalt(p.baslangic_saati),
              bitisSaati: saatKisalt(p.bitis_saati),
              baslangicTarihi: p.baslangic_tarihi,
              bitisTarihi: p.bitis_tarihi,
            };
            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
              >
                <div>
                  <div className="font-medium">
                    Her {haftaninGunuAdi(p.haftanin_gunu)}, {saat}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.baslangic_tarihi > bugun
                      ? `${kisaTarihFormatla(p.baslangic_tarihi)} tarihinden itibaren`
                      : null}
                    {p.baslangic_tarihi > bugun && p.bitis_tarihi ? ", " : null}
                    {p.bitis_tarihi
                      ? `${kisaTarihFormatla(p.bitis_tarihi)} tarihine kadar`
                      : null}
                    {p.baslangic_tarihi <= bugun && !p.bitis_tarihi
                      ? "Süresiz"
                      : null}
                  </div>
                </div>
                <div className="flex shrink-0">
                  <ProgramFormuDialog
                    grupId={grupId}
                    program={program}
                    bugun={bugun}
                    tetikleyici={
                      <Button variant="ghost" size="icon-sm">
                        <PencilIcon />
                        <span className="sr-only">Programı düzenle</span>
                      </Button>
                    }
                  />
                  <ProgramSonlandirDialog
                    programId={p.id}
                    programAdi={`Her ${haftaninGunuAdi(p.haftanin_gunu)} ${saat}`}
                    bugun={bugun}
                  />
                </div>
              </div>
            );
          })
        )}

        {bitenler.length > 0 ? (
          <details className="mt-2 text-muted-foreground">
            <summary className="cursor-pointer text-xs">
              Sona ermiş programlar ({bitenler.length})
            </summary>
            <ul className="mt-1 flex flex-col gap-1 pl-2 text-xs">
              {bitenler.map((p) => (
                <li key={p.id}>
                  {haftaninGunuAdi(p.haftanin_gunu)}{" "}
                  {saatKisalt(p.baslangic_saati)}–{saatKisalt(p.bitis_saati)} ·{" "}
                  {kisaTarihFormatla(p.baslangic_tarihi)} –{" "}
                  {kisaTarihFormatla(p.bitis_tarihi!)}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
