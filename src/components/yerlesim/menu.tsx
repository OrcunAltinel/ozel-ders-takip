"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArchiveIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  HandCoinsIcon,
  LayersIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

type MenuOgesi = {
  href: string;
  etiket: string;
  ikon: LucideIcon;
  sadeceYonetici?: boolean;
};

const MENU_OGELERI: MenuOgesi[] = [
  { href: "/", etiket: "Bugün", ikon: CalendarCheckIcon },
  { href: "/takvim", etiket: "Takvim", ikon: CalendarDaysIcon },
  { href: "/ogrenciler", etiket: "Öğrenciler", ikon: UsersIcon },
  { href: "/gruplar", etiket: "Gruplar", ikon: LayersIcon },
  { href: "/odemeler", etiket: "Ödemeler", ikon: WalletIcon },
  { href: "/borclar", etiket: "Borçlar", ikon: HandCoinsIcon },
  { href: "/arsiv", etiket: "Arşiv", ikon: ArchiveIcon },
  { href: "/ayarlar", etiket: "Ayarlar", ikon: SettingsIcon },
  {
    href: "/yonetim",
    etiket: "Yönetim",
    ikon: ShieldCheckIcon,
    sadeceYonetici: true,
  },
];

function aktifMi(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Menu({
  yoneticiMi,
  tiklaninca,
}: {
  yoneticiMi: boolean;
  /** Mobil menüde bir bağlantıya tıklanınca menüyü kapatmak için. */
  tiklaninca?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {MENU_OGELERI.filter((oge) => !oge.sadeceYonetici || yoneticiMi).map(
        ({ href, etiket, ikon: Ikon }) => (
          <Link
            key={href}
            href={href}
            onClick={tiklaninca}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              aktifMi(pathname, href) &&
                "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <Ikon className="size-4" />
            {etiket}
          </Link>
        ),
      )}
    </nav>
  );
}
