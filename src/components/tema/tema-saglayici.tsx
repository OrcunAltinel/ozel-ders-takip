"use client";

import { ThemeProvider } from "next-themes";

/**
 * Açık / koyu / sistem teması. Seçim tarayıcıda (localStorage) saklanır;
 * `class` stratejisi globals.css'teki `.dark` değişkenlerini etkinleştirir.
 * next-themes, sayfa çizilmeden önce çalışan küçük bir betikle temayı
 * uygular; böylece açılışta beyaz ekran yanıp sönmez.
 */
export function TemaSaglayici({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
