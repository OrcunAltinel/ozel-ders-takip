import Link from "next/link";
import { oturumGetir } from "@/lib/auth/oturum";
import { Menu } from "@/components/yerlesim/menu";
import { MobilMenu } from "@/components/yerlesim/mobil-menu";
import { KullaniciMenusu } from "@/components/yerlesim/kullanici-menusu";
import { TemaDegistirici } from "@/components/tema/tema-degistirici";

export default async function UygulamaYerlesimi({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { profil } = await oturumGetir();
  const yoneticiMi = profil.rol === "yonetici";

  return (
    <div className="flex flex-1">
      <a
        href="#ana-icerik"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-background focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:ring-2 focus-visible:ring-ring"
      >
        İçeriğe atla
      </a>
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r bg-sidebar px-3 py-5 md:flex">
        <Link href="/" className="px-3 text-base font-semibold">
          Özel Ders Takip
        </Link>
        <Menu yoneticiMi={yoneticiMi} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <MobilMenu yoneticiMi={yoneticiMi} />
            <span className="font-semibold md:hidden">Özel Ders Takip</span>
          </div>
          <div className="flex items-center gap-1">
            <TemaDegistirici />
            <KullaniciMenusu
              adSoyad={profil.ad_soyad}
              kullaniciAdi={profil.kullanici_adi}
            />
          </div>
        </header>
        <main id="ana-icerik" tabIndex={-1} className="flex-1 p-4 md:p-6 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
