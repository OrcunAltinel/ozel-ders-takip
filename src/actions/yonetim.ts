"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { kullaniciAdindanEmailUret } from "@/lib/auth/kullanici-adi";
import { yoneticiOturumu } from "@/lib/auth/yonetici";
import type { IslemSonucu } from "@/lib/islem-sonucu";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  kullaniciOlusturSemasi,
  profilDuzenleSemasi,
  sifreSifirlaSemasi,
  type KullaniciOlusturGirdisi,
  type ProfilDuzenleGirdisi,
  type SifreSifirlaGirdisi,
} from "@/lib/validasyon/yonetim";

const idSemasi = z.uuid();
const YETKISIZ = { hata: "Bu işlem için yetkiniz yok." } as const;

/** Pasif hesapların girişini Supabase Auth seviyesinde engellemek için (~100 yıl). */
const SURESIZ_YASAK = "876000h";

function sayfalariYenile(kullaniciId?: string) {
  revalidatePath("/yonetim");
  if (kullaniciId) revalidatePath(`/yonetim/${kullaniciId}`);
}

/** Yeni hoca (veya yönetici) hesabı oluşturur. */
export async function kullaniciOlustur(
  girdi: KullaniciOlusturGirdisi,
): Promise<IslemSonucu> {
  if (!(await yoneticiOturumu())) return YETKISIZ;

  const sonuc = kullaniciOlusturSemasi.safeParse(girdi);
  if (!sonuc.success) return { hata: "Form bilgileri geçersiz." };
  const { kullaniciAdi, adSoyad, sifre, rol } = sonuc.data;

  const admin = createAdminClient();

  const { data: mevcut } = await admin
    .from("profiller")
    .select("id")
    .eq("kullanici_adi", kullaniciAdi)
    .maybeSingle();
  if (mevcut) return { hata: "Bu kullanıcı adı zaten kullanılıyor." };

  const { data: olusturulan, error } = await admin.auth.admin.createUser({
    email: kullaniciAdindanEmailUret(kullaniciAdi),
    password: sifre,
    email_confirm: true,
  });
  if (error || !olusturulan.user) {
    return {
      hata: error?.message.includes("already")
        ? "Bu kullanıcı adı zaten kullanılıyor."
        : "Hesap oluşturulamadı. Lütfen tekrar deneyin.",
    };
  }

  const { error: profilHatasi } = await admin.from("profiller").insert({
    id: olusturulan.user.id,
    kullanici_adi: kullaniciAdi,
    ad_soyad: adSoyad,
    rol,
    aktif: true,
  });
  if (profilHatasi) {
    // Yarım kalan auth kullanıcısını temizle ki tekrar denenebilsin.
    await admin.auth.admin.deleteUser(olusturulan.user.id);
    return { hata: "Hesap oluşturulamadı. Lütfen tekrar deneyin." };
  }

  sayfalariYenile();
  return { basarili: true };
}

export async function sifreSifirla(
  kullaniciId: string,
  girdi: SifreSifirlaGirdisi,
): Promise<IslemSonucu> {
  if (!(await yoneticiOturumu())) return YETKISIZ;

  const sonuc = sifreSifirlaSemasi.safeParse(girdi);
  if (!sonuc.success || !idSemasi.safeParse(kullaniciId).success) {
    return { hata: "Form bilgileri geçersiz." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(kullaniciId, {
    password: sonuc.data.sifre,
  });
  if (error) return { hata: "Şifre değiştirilemedi. Lütfen tekrar deneyin." };

  return { basarili: true };
}

/**
 * Hesabı pasifleştirir veya tekrar aktifleştirir. Pasif hesap giriş
 * yapamaz (Auth'ta yasaklanır) ve açık oturumu bir sonraki sayfa
 * isteğinde kapatılır (uygulama yerleşimi profil.aktif'i kontrol eder).
 * Verileri silinmez.
 */
export async function aktiflikDegistir(
  kullaniciId: string,
  aktif: boolean,
): Promise<IslemSonucu> {
  const oturum = await yoneticiOturumu();
  if (!oturum) return YETKISIZ;
  if (!idSemasi.safeParse(kullaniciId).success)
    return { hata: "Geçersiz istek." };
  if (kullaniciId === oturum.kullanici.id) {
    return { hata: "Kendi hesabınızı pasifleştiremezsiniz." };
  }

  const admin = createAdminClient();

  const { error: authHatasi } = await admin.auth.admin.updateUserById(
    kullaniciId,
    { ban_duration: aktif ? "none" : SURESIZ_YASAK },
  );
  if (authHatasi)
    return { hata: "Hesap durumu değiştirilemedi. Lütfen tekrar deneyin." };

  const { error } = await admin
    .from("profiller")
    .update({ aktif })
    .eq("id", kullaniciId);
  if (error)
    return { hata: "Hesap durumu değiştirilemedi. Lütfen tekrar deneyin." };

  sayfalariYenile(kullaniciId);
  return { basarili: true };
}

/** Ad soyad ve rolü günceller. Yönetici kendi rolünü düşüremez. */
export async function profilDuzenle(
  kullaniciId: string,
  girdi: ProfilDuzenleGirdisi,
): Promise<IslemSonucu> {
  const oturum = await yoneticiOturumu();
  if (!oturum) return YETKISIZ;

  const sonuc = profilDuzenleSemasi.safeParse(girdi);
  if (!sonuc.success || !idSemasi.safeParse(kullaniciId).success) {
    return { hata: "Form bilgileri geçersiz." };
  }
  if (kullaniciId === oturum.kullanici.id && sonuc.data.rol !== "yonetici") {
    return { hata: "Kendi yönetici yetkinizi kaldıramazsınız." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiller")
    .update({ ad_soyad: sonuc.data.adSoyad, rol: sonuc.data.rol })
    .eq("id", kullaniciId)
    .select("id");
  if (error || !data?.length) {
    return { hata: "Bilgiler güncellenemedi. Lütfen tekrar deneyin." };
  }

  sayfalariYenile(kullaniciId);
  revalidatePath("/", "layout");
  return { basarili: true };
}
