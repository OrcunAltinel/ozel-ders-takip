import { Card, CardContent } from "@/components/ui/card";

/** Henüz geliştirilmemiş sayfalar için geçici içerik. */
export function Yakinda({ asama }: { asama: number }) {
  return (
    <Card>
      <CardContent className="text-sm text-muted-foreground">
        Bu sayfa Aşama {asama}&apos;te eklenecek.
      </CardContent>
    </Card>
  );
}
