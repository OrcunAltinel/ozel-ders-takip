-- Ek aşama: Ders ücreti ders başından SAATLİĞE çevrilir.
-- Yoklama ücreti artık dersin süresi (bitis_saati - baslangic_saati, saat
-- cinsinden) ile saatlik ücretin çarpımıdır. Böylece 2 saatlik bir ders
-- 1 saatlik dersin iki katı tutar. Kayıtlı yoklama ücretleri (immutable)
-- korunur; yalnızca bundan sonra alınan yoklamalar yeni kurala göre hesaplanır.

alter table public.hoca_ayarlari rename column ders_ucreti to saatlik_ucret;

comment on table public.hoca_ayarlari is 'Hoca başına tek satır. saatlik_ucret tüm öğrenciler için saat başı ücrettir; bir yoklamanın ücreti = saatlik_ucret × ders süresi (saat). Değişiklik yalnızca sonraki yoklamalara yansır.';

-- Yoklama ücreti ilk INSERT'te saatlik ücret × ders süresinden hesaplanır;
-- güncellemede (ör. gelmedi -> geldi) eski ücret korunur. search_path 0009'daki
-- gibi public olarak sabitlenir.
create or replace function public.yoklama_once_islemler()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  d public.dersler;
  v_saatlik numeric(10, 2);
  v_sure numeric;  -- saat cinsinden ders süresi
begin
  select * into d
  from public.dersler
  where id = new.ders_id and hoca_id = new.hoca_id;
  if not found then
    raise exception 'Yoklama yalnızca kendi hocasına ait bir derse eklenebilir.';
  end if;

  if not exists (
    select 1 from public.ogrenciler
    where id = new.ogrenci_id and hoca_id = new.hoca_id
  ) then
    raise exception 'Yoklama yalnızca kendi hocasına ait bir öğrenciye eklenebilir.';
  end if;

  if tg_op = 'INSERT' then
    select saatlik_ucret into v_saatlik
    from public.hoca_ayarlari
    where hoca_id = new.hoca_id;

    if v_saatlik is null then
      raise exception 'Saatlik ücret belirlenmemiş. Önce Ayarlar sayfasından saatlik ücreti girin.';
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
