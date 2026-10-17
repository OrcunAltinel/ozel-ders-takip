import type { Metadata } from "next";
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
