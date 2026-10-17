import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TemaSaglayici } from "@/components/tema/tema-saglayici";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Özel Ders Takip",
  description: "Özel ders yoklama, takvim ve borç takip sistemi",
};

// Tarayıcı arayüz rengi sayfa arka planıyla eşleşir (globals.css'teki
// --background: açık temada beyaz, koyu temada oklch(0.145 0 0) ≈ #0a0a0a).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      // next-themes, çizimden önce <html>'e "dark" sınıfı ekler.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TemaSaglayici>
          <TooltipProvider delay={200}>
            {children}
            <Toaster richColors position="top-center" />
          </TooltipProvider>
        </TemaSaglayici>
      </body>
    </html>
  );
}
