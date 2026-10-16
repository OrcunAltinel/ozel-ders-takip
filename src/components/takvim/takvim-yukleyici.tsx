"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { GrupSecenegi } from "./ders-formu-dialog";

// FullCalendar tarayıcı API'lerine dayandığı için yalnızca istemcide yüklenir.
const Takvim = dynamic(() => import("./takvim").then((m) => m.Takvim), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full rounded-xl" />,
});

const MOBIL_SORGUSU = "(max-width: 767px)";

function mobilAboneOl(bildir: () => void) {
  const sorgu = window.matchMedia(MOBIL_SORGUSU);
  sorgu.addEventListener("change", bildir);
  return () => sorgu.removeEventListener("change", bildir);
}

export function TakvimYukleyici({ gruplar }: { gruplar: GrupSecenegi[] }) {
  const mobil = useSyncExternalStore(
    mobilAboneOl,
    () => window.matchMedia(MOBIL_SORGUSU).matches,
    () => false,
  );

  // Görünüm (mobil/masaüstü) değişince takvim baştan kurulur.
  return <Takvim key={mobil ? "mobil" : "masaustu"} gruplar={gruplar} mobil={mobil} />;
}
