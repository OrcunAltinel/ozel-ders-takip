"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { oturumGetir } from "@/lib/auth/oturum";
import type { IslemSonucu } from "@/lib/islem-sonucu";

const idSemasi = z.uuid();

function tumSayfalariYenile() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------- Öğrenci

/**
 * Öğrenciyi arşivler. Aktif listelerden ve yoklamalardan kalkar; borcu
 * varsa Borçlar sayfasında "Arşivde" etiketiyle görünmeye devam eder.
 */
export async function ogrenciArsivle(ogrenciId: string): Promise<IslemSonucu> {
  if (!idSemasi.safeParse(ogrenciId).success)
    return { hata: "Geçersiz istek." };

  const { supabase, kullanici } = await oturumGetir();

  const { data, error } = await supabase
    .from("ogrenciler")
    .update({ arsivlendi_at: new Date().toISOString() })
    .eq("id", ogrenciId)
    .eq("hoca_id", kullanici.id)
    .is("arsivlendi_at", null)
    .select("id");

  if (error || !data?.length) {
    return { hata: "Öğrenci arşivlenemedi. Lütfen tekrar deneyin." };
  }

  tumSayfalariYenile();
  return { basarili: true };
}

/** Öğrenciyi arşivden çıkarır. Eski grubu da arşivdeyse grupsuz döner. */
export async function ogrenciArsivdenCikar(
  ogrenciId: string,
): Promise<IslemSonucu> {
  if (!idSemasi.safeParse(ogrenciId).success)
    return { hata: "Geçersiz istek." };

  const { supabase, kullanici } = await oturumGetir();

  const { data: ogrenci } = await supabase
    .from("ogrenciler")
    .select("id, gruplar(arsivlendi_at)")
    .eq("id", ogrenciId)
    .eq("hoca_id", kullanici.id)
    .not("arsivlendi_at", "is", null)
    .maybeSingle();
  if (!ogrenci) return { hata: "Öğrenci bulunamadı." };

  const grupArsivde = ogrenci.gruplar?.arsivlendi_at != null;

  const { error } = await supabase
    .from("ogrenciler")
    .update({
      arsivlendi_at: null,
      ...(grupArsivde ? { grup_id: null } : {}),
    })
    .eq("id", ogrenciId)
    .eq("hoca_id", kullanici.id);

  if (error)
    return { hata: "Öğrenci arşivden çıkarılamadı. Lütfen tekrar deneyin." };

  tumSayfalariYenile();
  return { basarili: true };
}

/**
 * Arşivdeki bir öğrenciyi kalıcı olarak siler. Yoklaması veya ödemesi olan
 * öğrenci silinemez (veritabanında da ON DELETE RESTRICT ile korunur).
 */
export async function ogrenciKaliciSil(
  ogrenciId: string,
): Promise<IslemSonucu> {
  if (!idSemasi.safeParse(ogrenciId).success)
    return { hata: "Geçersiz istek." };

  const { supabase, kullanici } = await oturumGetir();

  const [{ count: yoklamaSayisi }, { count: odemeSayisi }] = await Promise.all([
    supabase
      .from("yoklamalar")
      .select("id", { count: "exact", head: true })
      .eq("ogrenci_id", ogrenciId),
    supabase
      .from("odemeler")
      .select("id", { count: "exact", head: true })
      .eq("ogrenci_id", ogrenciId),
  ]);
  if (yoklamaSayisi || odemeSayisi) {
    return {
      hata: "Ders veya ödeme geçmişi olan öğrenci kalıcı olarak silinemez; arşivde kalır.",
    };
  }

  const { data, error } = await supabase
    .from("ogrenciler")
    .delete()
    .eq("id", ogrenciId)
    .eq("hoca_id", kullanici.id)
    .not("arsivlendi_at", "is", null)
    .select("id");

  if (error || !data?.length) {
    return {
      hata: "Öğrenci silinemedi. Yalnızca arşivdeki ve geçmişi olmayan öğrenciler silinebilir.",
    };
  }

  tumSayfalariYenile();
  return { basarili: true };
}

// ------------------------------------------------------------------- Grup

/**
 * Grubu arşivler (veritabanında tek işlem): haftalık programlar bugün
 * sonlanır, gelecekteki dersler silinir, öğrenciler grupsuz kalır veya
 * istenirse onlar da arşivlenir.
 */
export async function grupArsivle(
  grupId: string,
  ogrencileriDeArsivle: boolean,
): Promise<IslemSonucu> {
  if (!idSemasi.safeParse(grupId).success) return { hata: "Geçersiz istek." };

  const { supabase } = await oturumGetir();

  const { error } = await supabase.rpc("grubu_arsivle", {
    p_grup_id: grupId,
    p_ogrencileri_de_arsivle: ogrencileriDeArsivle === true,
  });

  if (error) return { hata: "Grup arşivlenemedi. Lütfen tekrar deneyin." };

  tumSayfalariYenile();
  return { basarili: true };
}

/** Grubu arşivden çıkarır. Programlar ve öğrenciler geri gelmez, yeniden eklenir. */
export async function grupArsivdenCikar(grupId: string): Promise<IslemSonucu> {
  if (!idSemasi.safeParse(grupId).success) return { hata: "Geçersiz istek." };

  const { supabase, kullanici } = await oturumGetir();

  const { data, error } = await supabase
    .from("gruplar")
    .update({ arsivlendi_at: null })
    .eq("id", grupId)
    .eq("hoca_id", kullanici.id)
    .not("arsivlendi_at", "is", null)
    .select("id");

  if (error || !data?.length) {
    return { hata: "Grup arşivden çıkarılamadı. Lütfen tekrar deneyin." };
  }

  tumSayfalariYenile();
  return { basarili: true };
}

/**
 * Arşivdeki bir grubu kalıcı olarak siler. Dersi (geçmişi) olan grup
 * silinemez (veritabanında da ON DELETE RESTRICT ile korunur).
 */
export async function grupKaliciSil(grupId: string): Promise<IslemSonucu> {
  if (!idSemasi.safeParse(grupId).success) return { hata: "Geçersiz istek." };

  const { supabase, kullanici } = await oturumGetir();

  const { count: dersSayisi } = await supabase
    .from("dersler")
    .select("id", { count: "exact", head: true })
    .eq("grup_id", grupId);
  if (dersSayisi) {
    return {
      hata: "Ders geçmişi olan grup kalıcı olarak silinemez; arşivde kalır.",
    };
  }

  const { data, error } = await supabase
    .from("gruplar")
    .delete()
    .eq("id", grupId)
    .eq("hoca_id", kullanici.id)
    .not("arsivlendi_at", "is", null)
    .select("id");

  if (error || !data?.length) {
    return {
      hata: "Grup silinemedi. Yalnızca arşivdeki ve dersi olmayan gruplar silinebilir.",
    };
  }

  tumSayfalariYenile();
  return { basarili: true };
}
