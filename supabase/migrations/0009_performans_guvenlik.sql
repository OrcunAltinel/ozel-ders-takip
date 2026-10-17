-- Aşama 10: RLS performansı ve fonksiyon güvenliği (davranış değişmez).

-- 1) RLS: auth.uid() ve is_yonetici() bir alt sorguya sarılır. Böylece
--    Postgres bunları her satır için değil, sorgu başına BİR kez hesaplar
--    (Supabase'in "auth_rls_initplan" önerisi). Politikaların anlamı aynıdır.
alter policy "kendi_profilini_gorur" on public.profiller
  using (id = (select auth.uid()));
alter policy "yonetici_tum_profilleri_gorur" on public.profiller
  using ((select public.is_yonetici()));

alter policy "hoca_kendi_gruplarini_yonetir" on public.gruplar
  using (hoca_id = (select auth.uid())) with check (hoca_id = (select auth.uid()));
alter policy "yonetici_tum_gruplari_gorur" on public.gruplar
  using ((select public.is_yonetici()));

alter policy "hoca_kendi_ogrencilerini_yonetir" on public.ogrenciler
  using (hoca_id = (select auth.uid())) with check (hoca_id = (select auth.uid()));
alter policy "yonetici_tum_ogrencileri_gorur" on public.ogrenciler
  using ((select public.is_yonetici()));

alter policy "hoca_kendi_programlarini_yonetir" on public.ders_programlari
  using (hoca_id = (select auth.uid())) with check (hoca_id = (select auth.uid()));
alter policy "yonetici_tum_programlari_gorur" on public.ders_programlari
  using ((select public.is_yonetici()));

alter policy "hoca_kendi_derslerini_yonetir" on public.dersler
  using (hoca_id = (select auth.uid())) with check (hoca_id = (select auth.uid()));
alter policy "yonetici_tum_dersleri_gorur" on public.dersler
  using ((select public.is_yonetici()));

alter policy "hoca_kendi_yoklamalarini_yonetir" on public.yoklamalar
  using (hoca_id = (select auth.uid())) with check (hoca_id = (select auth.uid()));
alter policy "yonetici_tum_yoklamalari_gorur" on public.yoklamalar
  using ((select public.is_yonetici()));

alter policy "hoca_kendi_odemelerini_yonetir" on public.odemeler
  using (hoca_id = (select auth.uid())) with check (hoca_id = (select auth.uid()));
alter policy "yonetici_tum_odemeleri_gorur" on public.odemeler
  using ((select public.is_yonetici()));

alter policy "hoca_kendi_ayarlarini_yonetir" on public.hoca_ayarlari
  using (hoca_id = (select auth.uid())) with check (hoca_id = (select auth.uid()));
alter policy "yonetici_tum_ayarlari_gorur" on public.hoca_ayarlari
  using ((select public.is_yonetici()));

-- 2) Fonksiyonların search_path'i sabitlenir (search_path ele geçirme
--    saldırılarına karşı; Supabase'in "function_search_path_mutable" uyarısı).
--    Tüm fonksiyonlar tabloları zaten public. ön ekiyle kullanıyor.
alter function public.ogrenci_grup_hoca_kontrolu() set search_path = public;
alter function public.program_grup_hoca_kontrolu() set search_path = public;
alter function public.ders_grup_hoca_kontrolu() set search_path = public;
alter function public.yoklama_once_islemler() set search_path = public;
alter function public.odeme_hoca_kontrolu() set search_path = public;
alter function public.yoklamali_ders_silinemez() set search_path = public;
alter function public.dersleri_uret(date, date) set search_path = public;
alter function public.program_derslerini_temizle(uuid, date) set search_path = public;
alter function public.programi_sonlandir(uuid, date) set search_path = public;
alter function public.grubu_arsivle(uuid, boolean) set search_path = public;
