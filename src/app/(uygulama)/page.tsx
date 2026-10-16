import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { Yakinda } from "@/components/yerlesim/yakinda";

export default function BugunSayfasi() {
  return (
    <>
      <SayfaBasligi baslik="Bugün" />
      <Yakinda asama={6} />
    </>
  );
}
