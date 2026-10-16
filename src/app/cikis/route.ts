import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Oturumu kapatıp giriş sayfasına yönlendirir (pasif kullanıcı koruması için). */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/giris", request.url));
}
