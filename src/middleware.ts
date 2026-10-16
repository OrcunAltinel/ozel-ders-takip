import type { NextRequest } from "next/server";
import { oturumuGuncelle } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return oturumuGuncelle(request);
}

export const config = {
  matcher: [
    // _next statikleri, favicon ve genel resim dosyaları hariç her istek.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
