"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SECENEKLER = [
  { deger: "light", etiket: "Açık", ikon: SunIcon },
  { deger: "dark", etiket: "Koyu", ikon: MoonIcon },
  { deger: "system", etiket: "Sistem", ikon: MonitorIcon },
] as const;

const bosAbone = () => () => {};

/** Üst çubuktaki tema seçici (Açık / Koyu / Sistem). */
export function TemaDegistirici() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  // Seçili tema yalnızca tarayıcıda bilinir; sunucu çiziminde varsayılan
  // ikon gösterilir (hydration uyuşmazlığını önler).
  const istemcide = useSyncExternalStore(bosAbone, () => true, () => false);
  const koyu = istemcide && resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Tema">
            {koyu ? <MoonIcon /> : <SunIcon />}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Tema</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={istemcide ? (theme ?? "system") : "system"}
            onValueChange={(deger) => setTheme(deger)}
          >
            {SECENEKLER.map(({ deger, etiket, ikon: Ikon }) => (
              <DropdownMenuRadioItem key={deger} value={deger}>
                <Ikon />
                {etiket}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
