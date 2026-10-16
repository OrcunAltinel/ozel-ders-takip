import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GirisFormu } from "./giris-formu";

export default function GirisSayfasi() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Giriş Yap</CardTitle>
        </CardHeader>
        <CardContent>
          <GirisFormu />
        </CardContent>
      </Card>
    </div>
  );
}
