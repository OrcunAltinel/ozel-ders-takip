-- Ek aşama: Saatlik ücret grup ve öğrenci bazında da belirlenebilir.
-- Bir yoklamanın saatlik ücreti öncelik sırasıyla:
--   1. öğrencinin kişiye özel ücreti (ogrenciler.saatlik_ucret),
--   2. dersin grubunun ücreti (gruplar.saatlik_ucret),
--   3. hocanın varsayılan ücreti (hoca_ayarlari.saatlik_ucret).
-- Hepsi boşsa yoklama reddedilir. Kayıtlı yoklama ücretleri yine değişmez.

alter table public.gruplar
  add column saatlik_ucret numeric(10, 2) check (saatlik_ucret >= 0);

alter table public.ogrenciler
  add column saatlik_ucret numeric(10, 2) check (saatlik_ucret >= 0);

comment on column public.gruplar.saatlik_ucret is 'Grubun saatlik ücreti; null ise hocanın varsayılan saatlik ücreti kullanılır.';
comment on column public.ogrenciler.saatlik_ucret is 'Öğrenciye özel saatlik ücret; null ise grubun, o da yoksa hocanın varsayılan ücreti kullanılır.';
comment on table public.hoca_ayarlari is 'Hoca başına tek satır. saatlik_ucret varsayılan saat başı ücrettir (grup veya öğrenci ücreti yoksa). Bir yoklamanın ücreti = saatlik ücret × ders süresi (saat). Değişiklik yalnızca sonraki yoklamalara yansır.';

create or replace function public.yoklama_once_islemler()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  d public.dersler;
  v_ogrenci_ucreti numeric(10, 2);
  v_saatlik numeric(10, 2);
  v_sure numeric;  -- saat cinsinden ders süresi
begin
  select * into d
  from public.dersler
  where id = new.ders_id and hoca_id = new.hoca_id;
  if not found then
    raise exception 'Yoklama yalnızca kendi hocasına ait bir derse eklenebilir.';
  end if;

  select saatlik_ucret into v_ogrenci_ucreti
  from public.ogrenciler
  where id = new.ogrenci_id and hoca_id = new.hoca_id;
  if not found then
    raise exception 'Yoklama yalnızca kendi hocasına ait bir öğrenciye eklenebilir.';
  end if;

  if tg_op = 'INSERT' then
    v_saatlik := coalesce(
      v_ogrenci_ucreti,
      (select saatlik_ucret from public.gruplar
        where id = d.grup_id and hoca_id = new.hoca_id),
      (select saatlik_ucret from public.hoca_ayarlari
        where hoca_id = new.hoca_id)
    );

    if v_saatlik is null then
      raise exception 'Saatlik ücret belirlenmemiş. Ayarlar sayfasından varsayılan ücreti ya da grup/öğrenci ücretini girin.';
    end if;

    v_sure := extract(epoch from (d.bitis_saati - d.baslangic_saati)) / 3600.0;
    new.ucret := round(v_saatlik * v_sure, 2);
  else
    new.ucret := old.ucret;
  end if;

  new.updated_at := now();
  return new;
end;
$$;
