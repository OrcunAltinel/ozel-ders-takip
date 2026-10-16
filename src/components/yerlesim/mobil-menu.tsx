"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "./menu";

export function MobilMenu({ yoneticiMi }: { yoneticiMi: boolean }) {
  const [acik, setAcik] = useState(false);

  return (
    <Sheet open={acik} onOpenChange={setAcik}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden">
            <MenuIcon />
            <span className="sr-only">Menüyü aç</span>
          </Button>
        }
      />
      <SheetContent side="left" className="w-64 bg-sidebar">
        <SheetHeader>
          <SheetTitle>Özel Ders Takip</SheetTitle>
        </SheetHeader>
        <div className="px-3">
          <Menu yoneticiMi={yoneticiMi} tiklaninca={() => setAcik(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
