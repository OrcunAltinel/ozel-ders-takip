import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { Yakinda } from "@/components/yerlesim/yakinda";

export default function ArsivSayfasi() {
  return (
    <>
      <SayfaBasligi baslik="Arşiv" />
      <Yakinda asama={8} />
    </>
  );
}
