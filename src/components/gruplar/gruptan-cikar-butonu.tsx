"use client";

import { useTransition } from "react";
import { UserMinusIcon } from "lucide-react";
import { toast } from "sonner";
import { gruptanCikar } from "@/actions/gruplar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function GruptanCikarButonu({
  grupId,
  ogrenciId,
  ogrenciAdi,
}: {
  grupId: string;
  ogrenciId: string;
  ogrenciAdi: string;
}) {
  const [beklemede, baslatGecisi] = useTransition();

  function cikar() {
    baslatGecisi(async () => {
      const sonuc = await gruptanCikar(grupId, ogrenciId);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(`${ogrenciAdi} gruptan çıkarıldı.`);
    });
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={cikar}
            disabled={beklemede}
          >
            <UserMinusIcon />
            <span className="sr-only">Gruptan çıkar</span>
          </Button>
        }
      />
      <TooltipContent>Gruptan çıkar</TooltipContent>
    </Tooltip>
  );
}
