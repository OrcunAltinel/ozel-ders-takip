import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { Yakinda } from "@/components/yerlesim/yakinda";

export default function TakvimSayfasi() {
  return (
    <>
      <SayfaBasligi baslik="Takvim" />
      <Yakinda asama={5} />
    </>
  );
}
