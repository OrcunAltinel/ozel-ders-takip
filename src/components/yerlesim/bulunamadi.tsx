import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function Bulunamadi() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-5xl font-semibold text-muted-foreground">404</p>
      <h1 className="text-lg font-semibold">Sayfa bulunamadı</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Aradığınız sayfa yok, taşınmış ya da görüntüleme yetkiniz olmayabilir.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Ana sayfaya dön
      </Link>
    </div>
  );
}
