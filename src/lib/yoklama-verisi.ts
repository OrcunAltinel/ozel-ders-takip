import "server-only";
import { kimlikGetir } from "@/lib/auth/oturum";
import { saatKisalt } from "@/lib/zaman/saat";

export type YoklamaDurumu = "geldi" | "gelmedi";

export type YoklamaSatiri = {
  ogrenciId: string;
  adSoyad: string;
  /** Yoklama alınmamışsa null. */
  durum: YoklamaDurumu | null;
  /** Yoklama alınmışsa o anki ücret (sonradan değişmez). */
  ucret: number | null;
  /** Öğrenci artık bu grupta değil ama bu derste yoklaması var. */
  gruptanAyrildi: boolean;
};

export type YoklamaDersi = {
  id: string;
  tarih: string;
  baslangicSaati: string;
  bitisSaati: string;
  durum: "planli" | "yapildi" | "iptal";
  konu: string | null;
  grup: { id: string; ad: string; renk: string };
  yoklamaAlindi: boolean;
  satirlar: YoklamaSatiri[];
};

const DERS_ALANLARI =
  "id, tarih, baslangic_saati, bitis_saati, durum, konu, grup_id, gruplar(id, ad, renk)";

/**
 * Verilen filtreyle seçilen derslerin yoklama ekranı verisini hazırlar:
 * her ders için grubun güncel (arşivlenmemiş) üyeleri + o derste yoklaması
 * olan (sonradan gruptan ayrılmış olabilecek) öğrenciler.
 */
export async function yoklamaDersleriniGetir(
  filtre: { tur: "tarih"; tarih: string } | { tur: "id"; dersId: string },
): Promise<YoklamaDersi[]> {
  const { supabase, kullanici } = await kimlikGetir();

  let sorgu = supabase
    .from("dersler")
    .select(DERS_ALANLARI)
    .eq("hoca_id", kullanici.id);
  sorgu =
    filtre.tur === "tarih"
      ? sorgu.eq("tarih", filtre.tarih)
      : sorgu.eq("id", filtre.dersId);

  const { data: dersler } = await sorgu.order("baslangic_saati");
  if (!dersler?.length) return [];

  const grupIdleri = [...new Set(dersler.map((d) => d.grup_id))];
  const dersIdleri = dersler.map((d) => d.id);

  const [{ data: uyeler }, { data: yoklamalar }] = await Promise.all([
    supabase
      .from("ogrenciler")
      .select("id, ad_soyad, grup_id")
      .eq("hoca_id", kullanici.id)
      .in("grup_id", grupIdleri)
      .is("arsivlendi_at", null)
      .order("ad_soyad"),
    supabase
      .from("yoklamalar")
      .select("ders_id, ogrenci_id, durum, ucret, ogrenciler(ad_soyad)")
      .eq("hoca_id", kullanici.id)
      .in("ders_id", dersIdleri),
  ]);

  return dersler.map((ders) => {
    const dersYoklamalari = (yoklamalar ?? []).filter(
      (y) => y.ders_id === ders.id,
    );
    const yoklamaHaritasi = new Map(
      dersYoklamalari.map((y) => [y.ogrenci_id, y]),
    );
    const grupUyeleri = (uyeler ?? []).filter(
      (o) => o.grup_id === ders.grup_id,
    );
    const uyeIdleri = new Set(grupUyeleri.map((o) => o.id));

    const satirlar: YoklamaSatiri[] = [
      ...grupUyeleri.map((o) => {
        const y = yoklamaHaritasi.get(o.id);
        return {
          ogrenciId: o.id,
          adSoyad: o.ad_soyad,
          durum: (y?.durum as YoklamaDurumu | undefined) ?? null,
          ucret: y?.ucret ?? null,
          gruptanAyrildi: false,
        };
      }),
      ...dersYoklamalari
        .filter((y) => !uyeIdleri.has(y.ogrenci_id))
        .map((y) => ({
          ogrenciId: y.ogrenci_id,
          adSoyad: y.ogrenciler?.ad_soyad ?? "",
          durum: y.durum as YoklamaDurumu,
          ucret: y.ucret,
          gruptanAyrildi: true,
        })),
    ];

    return {
      id: ders.id,
      tarih: ders.tarih,
      baslangicSaati: saatKisalt(ders.baslangic_saati),
      bitisSaati: saatKisalt(ders.bitis_saati),
      durum: ders.durum as YoklamaDersi["durum"],
      konu: ders.konu,
      grup: ders.gruplar ?? { id: ders.grup_id, ad: "", renk: "#4b5563" },
      yoklamaAlindi: ders.durum === "yapildi" || dersYoklamalari.length > 0,
      satirlar,
    };
  });
}
