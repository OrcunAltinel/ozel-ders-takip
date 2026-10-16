import { oturumGetir } from "@/lib/auth/oturum";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { TakvimYukleyici } from "@/components/takvim/takvim-yukleyici";

export default async function TakvimSayfasi() {
  const { supabase, kullanici } = await oturumGetir();

  const { data: gruplar } = await supabase
    .from("gruplar")
    .select("id, ad, renk")
    .eq("hoca_id", kullanici.id)
    .is("arsivlendi_at", null)
    .order("ad");

  return (
    <>
      <SayfaBasligi
        baslik="Takvim"
        aciklama="Boş bir saate tıklayarak ders ekleyin; dersleri sürükleyerek taşıyabilirsiniz."
      />
      <TakvimYukleyici gruplar={gruplar ?? []} />
    </>
  );
}
