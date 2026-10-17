import "server-only";
import { notFound } from "next/navigation";
import { oturumGetir } from "@/lib/auth/oturum";

/**
 * Yönetim sayfaları için: oturumdaki kullanıcı yönetici değilse sayfa
 * yokmuş gibi 404 döner (panel gizlidir).
 */
export async function yoneticiSayfasi() {
  const oturum = await oturumGetir();
  if (oturum.profil.rol !== "yonetici") notFound();
  return oturum;
}

/**
 * Yönetim server action'ları için: yönetici değilse null döner. Action'lar
 * service role istemcisi (RLS'yi atlar) kullandığından bu kontrol zorunludur.
 */
export async function yoneticiOturumu() {
  const oturum = await oturumGetir();
  return oturum.profil.rol === "yonetici" ? oturum : null;
}
