import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GirisFormu } from "./giris-formu";

export default function GirisSayfasi() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          {/* CardTitle bir <div>'dir; giriş sayfasının tek başlığı olduğu
              için semantik <h1> kullanılır (CardTitle stilleri korunur). */}
          <h1 className="font-heading text-base leading-snug font-medium">
            Giriş Yap
          </h1>
        </CardHeader>
        <CardContent>
          <GirisFormu />
        </CardContent>
      </Card>
    </div>
  );
}
