/**
 * Uçtan uca veritabanı kontrol testi: RLS (çoklu hoca izolasyonu), yönetici
 * salt okuma yetkisi, ücret kuralları ve silme korumaları.
 *
 * Kullanım:
 *   npm run kontrol-testi
 *
 * GERÇEK Supabase projesinde geçici hesaplar (kontrol_*) ve veriler
 * oluşturur, testten sonra (hata olsa bile) hepsini siler. Mevcut verilere
 * dokunmaz. `.env.local` içindeki service role anahtarını kullanır.
 *
 * NOT: `src/lib/supabase/admin.ts` "server-only" olduğu için burada
 * kullanılamaz; script kendi istemcilerini oluşturur.
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVIS = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !ANON || !SERVIS) {
  console.error("Hata: .env.local içinde Supabase değişkenleri eksik.");
  process.exit(1);
}

type Istemci = SupabaseClient<Database>;
const SECENEKLER = { auth: { persistSession: false, autoRefreshToken: false } };
const admin: Istemci = createClient<Database>(URL_, SERVIS, SECENEKLER);
const ONEK = `kontrol_${Date.now()}`;
const SIFRE = "KontrolTesti!12345";
const olusturulanlar: string[] = [];

let basarili = 0;
let basarisiz = 0;
function kontrol(ad: string, kosul: boolean, ayrinti?: unknown) {
  if (kosul) {
    basarili++;
    console.log(`  ✓ ${ad}`);
  } else {
    basarisiz++;
    console.log(`  ✗ ${ad}${ayrinti === undefined ? "" : ` → ${JSON.stringify(ayrinti)}`}`);
  }
}
function bolum(ad: string) {
  console.log(`\n${ad}`);
}

async function hesapOlustur(ek: string, rol: "hoca" | "yonetici") {
  const kullaniciAdi = `${ONEK}_${ek}`;
  const email = `${kullaniciAdi}@ozelders.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SIFRE,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Hesap oluşturulamadı: ${error?.message}`);
  olusturulanlar.push(data.user.id);
  await admin.from("profiller").insert({
    id: data.user.id,
    kullanici_adi: kullaniciAdi,
    ad_soyad: kullaniciAdi,
    rol,
  });
  const istemci: Istemci = createClient<Database>(URL_!, ANON!, SECENEKLER);
  const { error: girisHatasi } = await istemci.auth.signInWithPassword({ email, password: SIFRE });
  if (girisHatasi) throw new Error(`Giriş yapılamadı: ${girisHatasi.message}`);
  return { id: data.user.id, sb: istemci };
}

async function temizle() {
  for (const id of olusturulanlar) {
    for (const tablo of [
      "yoklamalar",
      "odemeler",
      "dersler",
      "ders_programlari",
      "ogrenciler",
      "gruplar",
      "hoca_ayarlari",
    ] as const) {
      await admin.from(tablo).delete().eq("hoca_id", id);
    }
    await admin.from("profiller").delete().eq("id", id);
    await admin.auth.admin.deleteUser(id);
  }
}

async function bakiye(sb: Istemci, ogrenciId: string) {
  const { data } = await sb
    .from("ogrenci_bakiyeleri")
    .select("toplam_tahakkuk, toplam_odeme, bakiye")
    .eq("ogrenci_id", ogrenciId)
    .single();
  return {
    tahakkuk: Number(data?.toplam_tahakkuk),
    odeme: Number(data?.toplam_odeme),
    bakiye: Number(data?.bakiye),
  };
}

async function main() {
  console.log(`Kontrol testi başlıyor (geçici hesap öneki: ${ONEK})`);

  const a = await hesapOlustur("a", "hoca");
  const b = await hesapOlustur("b", "hoca");
  const y = await hesapOlustur("y", "yonetici");

  // --- A hocasının verileri
  await a.sb.from("hoca_ayarlari").insert({ hoca_id: a.id, ders_ucreti: 500 });
  const { data: grupA } = await a.sb.from("gruplar").insert({ hoca_id: a.id, ad: "A Grubu" }).select("id").single();
  const { data: ogrA } = await a.sb
    .from("ogrenciler")
    .insert({ hoca_id: a.id, ad_soyad: "A Öğrencisi", grup_id: grupA!.id })
    .select("id")
    .single();
  const { data: dersA1 } = await a.sb
    .from("dersler")
    .insert({ hoca_id: a.id, grup_id: grupA!.id, tarih: "2026-10-05", baslangic_saati: "10:00", bitis_saati: "11:00" })
    .select("id")
    .single();
  const { data: dersA2 } = await a.sb
    .from("dersler")
    .insert({ hoca_id: a.id, grup_id: grupA!.id, tarih: "2026-10-12", baslangic_saati: "10:00", bitis_saati: "11:00" })
    .select("id")
    .single();

  // --- B hocasının verileri
  const { data: grupB } = await b.sb.from("gruplar").insert({ hoca_id: b.id, ad: "B Grubu" }).select("id").single();
  const { data: ogrB } = await b.sb
    .from("ogrenciler")
    .insert({ hoca_id: b.id, ad_soyad: "B Öğrencisi", grup_id: grupB!.id })
    .select("id")
    .single();

  // ------------------------------------------------------------ RLS
  bolum("1) Çoklu hoca izolasyonu (RLS)");
  for (const tablo of ["gruplar", "ogrenciler", "dersler", "hoca_ayarlari", "ders_programlari", "yoklamalar", "odemeler"] as const) {
    const { data } = await b.sb.from(tablo).select("hoca_id");
    kontrol(`B, A'nın ${tablo} kayıtlarını göremez`, !(data ?? []).some((r) => r.hoca_id === a.id), data?.length);
  }
  const { data: profilB } = await b.sb.from("profiller").select("id");
  kontrol("B yalnızca kendi profilini görür", profilB?.length === 1 && profilB[0].id === b.id, profilB);
  const { data: bakiyeB } = await b.sb.from("ogrenci_bakiyeleri").select("ogrenci_id").eq("ogrenci_id", ogrA!.id);
  kontrol("B, A'nın öğrenci bakiyesini göremez (view)", (bakiyeB ?? []).length === 0);

  const { data: guncellenen } = await b.sb.from("ogrenciler").update({ ad_soyad: "Ele geçirildi" }).eq("id", ogrA!.id).select("id");
  kontrol("B, A'nın öğrencisini güncelleyemez", (guncellenen ?? []).length === 0);
  const { data: silinen } = await b.sb.from("gruplar").delete().eq("id", grupA!.id).select("id");
  kontrol("B, A'nın grubunu silemez", (silinen ?? []).length === 0);
  const { error: sahteSahip } = await b.sb.from("ogrenciler").insert({ hoca_id: a.id, ad_soyad: "Sahte" });
  kontrol("B, A adına kayıt ekleyemez", !!sahteSahip);
  const { error: caprazGrup } = await b.sb.from("ogrenciler").insert({ hoca_id: b.id, ad_soyad: "Çapraz", grup_id: grupA!.id });
  kontrol("B, öğrencisini A'nın grubuna bağlayamaz (tetikleyici)", !!caprazGrup);
  const { error: caprazYoklama } = await b.sb
    .from("yoklamalar")
    .insert({ hoca_id: b.id, ders_id: dersA1!.id, ogrenci_id: ogrB!.id, durum: "geldi", ucret: 0 });
  kontrol("B, A'nın dersine yoklama ekleyemez", !!caprazYoklama);
  const { error: caprazOdeme } = await b.sb
    .from("odemeler")
    .insert({ hoca_id: b.id, ogrenci_id: ogrA!.id, tutar: 100, tarih: "2026-10-01", odeme_yontemi: "nakit" });
  kontrol("B, A'nın öğrencisine ödeme ekleyemez", !!caprazOdeme);
  const { data: programA } = await a.sb
    .from("ders_programlari")
    .insert({ hoca_id: a.id, grup_id: grupA!.id, haftanin_gunu: 3, baslangic_saati: "18:00", bitis_saati: "19:00", baslangic_tarihi: "2026-10-01", bitis_tarihi: "2026-10-31" })
    .select("id")
    .single();
  await a.sb.rpc("dersleri_uret", { p_baslangic: "2026-10-01", p_bitis: "2026-10-31" });
  const programDersSayisi = async () =>
    (await admin.from("dersler").select("id", { count: "exact", head: true }).eq("program_id", programA!.id)).count;
  const onceki = await programDersSayisi();
  const { data: rpcSilinen } = await b.sb.rpc("program_derslerini_temizle", { p_program_id: programA!.id, p_tarihten: "2000-01-01" });
  const { error: rpcSonlandir } = await b.sb.rpc("programi_sonlandir", { p_program_id: programA!.id, p_son_tarih: "2000-01-01" });
  kontrol(
    "B, RPC ile A'nın programını/derslerini silemez",
    (onceki ?? 0) > 0 && rpcSilinen === 0 && !!rpcSonlandir && (await programDersSayisi()) === onceki,
    { onceki, rpcSilinen },
  );

  const anonim: Istemci = createClient<Database>(URL_!, ANON!, SECENEKLER);
  for (const tablo of ["profiller", "ogrenciler", "odemeler"] as const) {
    const { data } = await anonim.from(tablo).select("id");
    kontrol(`Oturumsuz istek ${tablo} okuyamaz`, (data ?? []).length === 0);
  }

  bolum("2) Yönetici: tümünü görür, hiçbirini değiştiremez");
  const { data: yOgr } = await y.sb.from("ogrenciler").select("id").in("id", [ogrA!.id, ogrB!.id]);
  kontrol("Yönetici iki hocanın öğrencilerini de görür", yOgr?.length === 2, yOgr);
  const { data: yProfil } = await y.sb.from("profiller").select("id").in("id", [a.id, b.id]);
  kontrol("Yönetici tüm profilleri görür", yProfil?.length === 2);
  const { data: yGuncel } = await y.sb.from("ogrenciler").update({ ad_soyad: "Yönetici değiştirdi" }).eq("id", ogrA!.id).select("id");
  kontrol("Yönetici hocanın öğrencisini güncelleyemez", (yGuncel ?? []).length === 0);
  const { data: ySil } = await y.sb.from("dersler").delete().eq("id", dersA1!.id).select("id");
  kontrol("Yönetici hocanın dersini silemez", (ySil ?? []).length === 0);
  const { error: yProfilYaz } = await y.sb.from("profiller").update({ rol: "yonetici" }).eq("id", a.id).select("id");
  const { data: aRol } = await admin.from("profiller").select("rol").eq("id", a.id).single();
  kontrol("Profiller istemciden değiştirilemez (rol yükseltme yok)", aRol?.rol === "hoca", yProfilYaz);
  const { error: hocaRol } = await a.sb.from("profiller").update({ rol: "yonetici" }).eq("id", a.id);
  const { data: aRol2 } = await admin.from("profiller").select("rol").eq("id", a.id).single();
  kontrol("Hoca kendini yönetici yapamaz", aRol2?.rol === "hoca", hocaRol);

  // ------------------------------------------------------------ Ücret
  bolum("3) Ücret senaryoları");
  const { data: y1 } = await a.sb
    .from("yoklamalar")
    .insert({ hoca_id: a.id, ders_id: dersA1!.id, ogrenci_id: ogrA!.id, durum: "geldi", ucret: 1 })
    .select("id, ucret")
    .single();
  kontrol("Yoklama ücreti hoca ayarından kopyalanır (istemcinin 1 ₺'si yok sayılır)", Number(y1?.ucret) === 500, y1);
  kontrol("Gelinen 1 ders → borç 500", (await bakiye(a.sb, ogrA!.id)).bakiye === 500);

  await a.sb.from("hoca_ayarlari").update({ ders_ucreti: 650 }).eq("hoca_id", a.id);
  const { data: y1b } = await a.sb.from("yoklamalar").update({ ucret: 9999 }).eq("id", y1!.id).select("ucret").single();
  kontrol("Kayıtlı yoklamanın ücreti sonradan değiştirilemez", Number(y1b?.ucret) === 500, y1b);

  const { data: y2 } = await a.sb
    .from("yoklamalar")
    .insert({ hoca_id: a.id, ders_id: dersA2!.id, ogrenci_id: ogrA!.id, durum: "gelmedi", ucret: 0 })
    .select("id, ucret")
    .single();
  kontrol("Ücret değişikliği yalnızca yeni yoklamalara yansır (650)", Number(y2?.ucret) === 650, y2);
  kontrol("Gelmediği ders borca yazılmaz → borç hâlâ 500", (await bakiye(a.sb, ogrA!.id)).bakiye === 500);

  await a.sb.from("hoca_ayarlari").update({ ders_ucreti: 800 }).eq("hoca_id", a.id);
  await a.sb.from("yoklamalar").update({ durum: "geldi" }).eq("id", y2!.id);
  kontrol("Gelmedi→geldi düzeltmesinde ilk kayıttaki ücret (650) kullanılır → borç 1150", (await bakiye(a.sb, ogrA!.id)).bakiye === 1150);

  await a.sb.from("odemeler").insert({ hoca_id: a.id, ogrenci_id: ogrA!.id, tutar: 1000, tarih: "2026-10-13", odeme_yontemi: "havale" });
  kontrol("1000 ₺ ödeme → borç 150", (await bakiye(a.sb, ogrA!.id)).bakiye === 150);
  await a.sb.from("odemeler").insert({ hoca_id: a.id, ogrenci_id: ogrA!.id, tutar: 400, tarih: "2026-10-14", odeme_yontemi: "nakit" });
  const fazla = await bakiye(a.sb, ogrA!.id);
  kontrol("Fazla ödeme → bakiye -250 (öğrenci alacaklı)", fazla.bakiye === -250 && fazla.odeme === 1400 && fazla.tahakkuk === 1150, fazla);
  const { error: sifirOdeme } = await a.sb.from("odemeler").insert({ hoca_id: a.id, ogrenci_id: ogrA!.id, tutar: 0, tarih: "2026-10-14", odeme_yontemi: "nakit" });
  kontrol("Sıfır/negatif tutarlı ödeme reddedilir", !!sifirOdeme);

  const { data: grupB2 } = await b.sb.from("gruplar").insert({ hoca_id: b.id, ad: "B2" }).select("id").single();
  const { data: dersB } = await b.sb
    .from("dersler")
    .insert({ hoca_id: b.id, grup_id: grupB2!.id, tarih: "2026-10-05", baslangic_saati: "10:00", bitis_saati: "11:00" })
    .select("id")
    .single();
  const { error: ucretsiz } = await b.sb
    .from("yoklamalar")
    .insert({ hoca_id: b.id, ders_id: dersB!.id, ogrenci_id: ogrB!.id, durum: "geldi", ucret: 100 });
  kontrol("Ders ücreti belirlenmemiş hocanın yoklaması reddedilir", !!ucretsiz && ucretsiz.message.includes("Ders ücreti"), ucretsiz?.message);

  // ------------------------------------------------------------ Silme
  bolum("4) Silme korumaları");
  const { error: yoklamaliDers } = await a.sb.from("dersler").delete().eq("id", dersA1!.id);
  kontrol("Yoklaması olan ders silinemez", !!yoklamaliDers);
  const { error: gecmisliOgrenci } = await a.sb.from("ogrenciler").delete().eq("id", ogrA!.id);
  kontrol("Yoklaması/ödemesi olan öğrenci silinemez", !!gecmisliOgrenci);
  const { error: dersliGrup } = await a.sb.from("gruplar").delete().eq("id", grupA!.id);
  kontrol("Dersi olan grup silinemez", !!dersliGrup);
  const { data: bosOgrenci } = await a.sb.from("ogrenciler").insert({ hoca_id: a.id, ad_soyad: "Geçmişsiz" }).select("id").single();
  const { error: bosSil } = await a.sb.from("ogrenciler").delete().eq("id", bosOgrenci!.id);
  kontrol("Geçmişi olmayan öğrenci silinebilir", !bosSil, bosSil);
}

main()
  .catch((hata) => {
    basarisiz++;
    console.error("\nBeklenmeyen hata:", hata instanceof Error ? hata.message : hata);
  })
  .finally(async () => {
    await temizle();
    console.log(`\nSonuç: ${basarili} başarılı, ${basarisiz} başarısız. Geçici hesaplar silindi.`);
    process.exitCode = basarisiz > 0 ? 1 : 0;
  });
