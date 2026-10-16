-- Ders ücreti öğrenci bazından hoca bazına taşınır: her hocanın tek bir
-- ders ücreti vardır ve tüm öğrencileri için geçerlidir.

create table public.hoca_ayarlari (
  hoca_id uuid primary key references public.profiller (id) on delete cascade,
  ders_ucreti numeric(10, 2) not null check (ders_ucreti >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.hoca_ayarlari is 'Hoca başına tek satır. ders_ucreti tüm öğrenciler için ders başı ücrettir; değişiklik yalnızca sonraki yoklamalara yansır.';

alter table public.hoca_ayarlari enable row level security;

create policy "hoca_kendi_ayarlarini_yonetir" on public.hoca_ayarlari
  for all
  using (hoca_id = auth.uid())
  with check (hoca_id = auth.uid());

create policy "yonetici_tum_ayarlari_gorur" on public.hoca_ayarlari
  for select
  using (public.is_yonetici());

-- Mevcut öğrenci ücretlerini koru: her hoca için en yüksek öğrenci ücreti
-- başlangıç değeri olarak alınır.
insert into public.hoca_ayarlari (hoca_id, ders_ucreti)
select hoca_id, max(ders_ucreti)
from public.ogrenciler
group by hoca_id
on conflict (hoca_id) do nothing;

-- Yoklama ücreti artık hoca ayarından kopyalanır (ilk INSERT'te), sonraki
-- güncellemelerde eski ücret korunur.
create or replace function public.yoklama_once_islemler()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.dersler
    where id = new.ders_id and hoca_id = new.hoca_id
  ) then
    raise exception 'Yoklama yalnızca kendi hocasına ait bir derse eklenebilir.';
  end if;

  if not exists (
    select 1 from public.ogrenciler
    where id = new.ogrenci_id and hoca_id = new.hoca_id
  ) then
    raise exception 'Yoklama yalnızca kendi hocasına ait bir öğrenciye eklenebilir.';
  end if;

  if tg_op = 'INSERT' then
    select ders_ucreti into new.ucret
    from public.hoca_ayarlari
    where hoca_id = new.hoca_id;

    if new.ucret is null then
      raise exception 'Ders ücreti belirlenmemiş. Önce Ayarlar sayfasından ders ücretini girin.';
    end if;
  else
    new.ucret := old.ucret;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- Eski öğrenci bazlı ücret sütunu artık kullanılmıyor. Veri kaybı olmasın
-- diye silinmedi, yalnızca zorunluluğu kaldırıldı (uygulama artık yazmıyor).
alter table public.ogrenciler alter column ders_ucreti drop not null;

comment on column public.ogrenciler.ders_ucreti is 'KULLANILMIYOR (0006 ile hoca_ayarlari.ders_ucreti''ne taşındı). İleride kaldırılabilir.';
