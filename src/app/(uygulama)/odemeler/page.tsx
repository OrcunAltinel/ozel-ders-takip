import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { Yakinda } from "@/components/yerlesim/yakinda";

export default function OdemelerSayfasi() {
  return (
    <>
      <SayfaBasligi baslik="Ödemeler" />
      <Yakinda asama={7} />
    </>
  );
}
