import { dersUcretiGetir } from "@/lib/ayarlar";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { DersUcretiFormu } from "@/components/ayarlar/ders-ucreti-formu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AyarlarSayfasi() {
  const dersUcreti = await dersUcretiGetir();

  return (
    <>
      <SayfaBasligi baslik="Ayarlar" />
      <Card>
        <CardHeader>
          <CardTitle>Ders ücreti</CardTitle>
        </CardHeader>
        <CardContent>
          <DersUcretiFormu mevcutUcret={dersUcreti} />
        </CardContent>
      </Card>
    </>
  );
}
