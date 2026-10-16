import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { Yakinda } from "@/components/yerlesim/yakinda";

export default function BorclarSayfasi() {
  return (
    <>
      <SayfaBasligi baslik="Borçlar" />
      <Yakinda asama={7} />
    </>
  );
}
