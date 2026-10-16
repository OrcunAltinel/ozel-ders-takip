import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Özel Ders Takip Sistemi</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Kurulum tamamlandı. Giriş, takvim ve yoklama ekranları ilerleyen
          aşamalarda bu sayfanın yerini alacak.
        </CardContent>
      </Card>
    </div>
  );
}
