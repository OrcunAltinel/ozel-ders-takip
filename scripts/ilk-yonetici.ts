/**
 * İlk yönetici (gizli süper kullanıcı) hesabını oluşturur.
 *
 * Kullanım:
 *   npm run ilk-yonetici -- --kullanici <kullanici_adi> --sifre <sifre> --ad "<Ad Soyad>"
 *
 * Örnek:
 *   npm run ilk-yonetici -- --kullanici admin --sifre guvenliSifre123 --ad "Sistem Yöneticisi"
 *
 * NOT: `src/lib/supabase/admin.ts` burada KASTEN kullanılmıyor; o dosya
 * "server-only" paketiyle korunuyor ve Next.js dışında (düz bir tsx
 * script'inde) çalıştırıldığında import anında hata fırlatır. Bu yüzden
 * script kendi admin istemcisini oluşturuyor.
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  kullaniciAdiGecerliMi,
  kullaniciAdiNormallestir,
  kullaniciAdindanEmailUret,
} from "../src/lib/auth/kullanici-adi";
import type { Database } from "../src/types/database.types";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

function argiOku(bayrak: string): string | undefined {
  const index = process.argv.indexOf(bayrak);
  if (index === -1 || index === process.argv.length - 1) return undefined;
  return process.argv[index + 1];
}

function hataIleCik(mesaj: string): never {
  console.error(`Hata: ${mesaj}`);
  process.exit(1);
}

async function main() {
  const kullaniciAdiGirdi = argiOku("--kullanici");
  const sifre = argiOku("--sifre");
  const adSoyad = argiOku("--ad");

  if (!kullaniciAdiGirdi || !sifre || !adSoyad) {
    hataIleCik(
      "Eksik parametre. Kullanım: npm run ilk-yonetici -- --kullanici <kullanici_adi> --sifre <sifre> --ad \"<Ad Soyad>\"",
    );
  }

  const kullaniciAdi = kullaniciAdiNormallestir(kullaniciAdiGirdi);

  if (!kullaniciAdiGecerliMi(kullaniciAdi)) {
    hataIleCik(
      "Kullanıcı adı yalnızca küçük harf, rakam, '.' ve '_' içerebilir.",
    );
  }

  if (sifre.length < 8) {
    hataIleCik("Şifre en az 8 karakter olmalıdır.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    hataIleCik(
      "NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri .env.local içinde tanımlı olmalı.",
    );
  }

  const supabase = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = kullaniciAdindanEmailUret(kullaniciAdi);

  const { data: olusturulanKullanici, error: olusturmaHatasi } =
    await supabase.auth.admin.createUser({
      email,
      password: sifre,
      email_confirm: true,
    });

  if (olusturmaHatasi || !olusturulanKullanici.user) {
    hataIleCik(
      `Kullanıcı oluşturulamadı: ${olusturmaHatasi?.message ?? "bilinmeyen hata"}`,
    );
    return;
  }

  const { error: profilHatasi } = await supabase.from("profiller").insert({
    id: olusturulanKullanici.user.id,
    kullanici_adi: kullaniciAdi,
    ad_soyad: adSoyad,
    rol: "yonetici",
    aktif: true,
  });

  if (profilHatasi) {
    // Yarım kalan auth kullanıcısını temizle ki tekrar denenebilsin.
    await supabase.auth.admin.deleteUser(olusturulanKullanici.user.id);
    hataIleCik(`Profil oluşturulamadı: ${profilHatasi.message}`);
    return;
  }

  console.log(`✓ İlk yönetici oluşturuldu: ${kullaniciAdi} (${adSoyad})`);
  console.log("Artık /giris sayfasından bu kullanıcı adı ve şifre ile giriş yapabilirsiniz.");
}

main().catch((hata) => {
  hataIleCik(hata instanceof Error ? hata.message : String(hata));
});
