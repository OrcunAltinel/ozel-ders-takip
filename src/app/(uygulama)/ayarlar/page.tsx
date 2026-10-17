import { saatlikUcretGetir } from "@/lib/ayarlar";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { DersUcretiFormu } from "@/components/ayarlar/ders-ucreti-formu";
import { SifreFormu } from "@/components/ayarlar/sifre-formu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AyarlarSayfasi() {
  const saatlikUcret = await saatlikUcretGetir();

  return (
    <>
      <SayfaBasligi baslik="Ayarlar" />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Saatlik ücret</CardTitle>
          </CardHeader>
          <CardContent>
            <DersUcretiFormu mevcutUcret={saatlikUcret} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Şifre</CardTitle>
            <CardDescription>Hesap şifrenizi değiştirin.</CardDescription>
          </CardHeader>
          <CardContent>
            <SifreFormu />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
