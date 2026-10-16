import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.join(process.cwd(), ".env.local") });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const ad = "e2e_tarayici";
async function main() {
  if (process.argv[2] === "olustur") {
    const { data, error } = await admin.auth.admin.createUser({ email: `${ad}@ozelders.local`, password: "GeciciSifre123!", email_confirm: true });
    if (error) throw error;
    const id = data.user.id;
    await admin.from("profiller").insert({ id, kullanici_adi: ad, ad_soyad: "Tarayıcı Test", rol: "hoca" });
    await admin.from("hoca_ayarlari").insert({ hoca_id: id, ders_ucreti: 750 });
    const { data: g } = await admin.from("gruplar").insert({ hoca_id: id, ad: "Fizik 10B", renk: "#16a34a" }).select("id").single();
    const { data: g2 } = await admin.from("gruplar").insert({ hoca_id: id, ad: "Kimya 11A", renk: "#2563eb" }).select("id").single();
    await admin.from("ogrenciler").insert([{ hoca_id: id, ad_soyad: "Ali Veli", grup_id: g!.id }, { hoca_id: id, ad_soyad: "Ayşe Kaya", grup_id: g!.id }, { hoca_id: id, ad_soyad: "Mehmet Demir", grup_id: g2!.id }]);
    await admin.from("dersler").insert([
      { hoca_id: id, grup_id: g!.id, tarih: "2026-10-17", baslangic_saati: "10:00", bitis_saati: "16:30" },
      { hoca_id: id, grup_id: g2!.id, tarih: "2026-10-17", baslangic_saati: "17:00", bitis_saati: "17:30", konu: "Mol kavramı" },
    ]);
    console.log("olusturuldu", id, g!.id, g2!.id);
  } else {
    const { data } = await admin.from("profiller").select("id").eq("kullanici_adi", ad).maybeSingle();
    if (!data) return console.log("yok");
    for (const t of ["yoklamalar", "odemeler", "dersler", "ders_programlari", "ogrenciler", "gruplar", "hoca_ayarlari"] as const)
      await admin.from(t).delete().eq("hoca_id", data.id);
    await admin.from("profiller").delete().eq("id", data.id);
    await admin.auth.admin.deleteUser(data.id);
    console.log("silindi");
  }
}
main();
