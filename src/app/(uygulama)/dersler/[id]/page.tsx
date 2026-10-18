import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { z } from "zod";
import { yoklamaDersleriniGetir } from "@/lib/yoklama-verisi";
import { bugununTarihi, tarihFormatla } from "@/lib/zaman/istanbul";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { DersYoklamaKarti } from "@/components/yoklama/ders-yoklama-karti";

export default async function DersSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [ders] = await yoklamaDersleriniGetir({ tur: "id", dersId: id });
  if (!ders) notFound();

  return (
    <>
      <Link
        href="/takvim"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Takvim
      </Link>
      <SayfaBasligi baslik="Yoklama" aciklama={tarihFormatla(ders.tarih)} />
      <div className="max-w-2xl">
        <DersYoklamaKarti
          ders={ders}
          bugun={bugununTarihi()}
          tarihiGoster
        />
      </div>
    </>
  );
}
