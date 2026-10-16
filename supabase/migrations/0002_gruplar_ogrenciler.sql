-- Gruplar ve öğrenciler.

create table public.gruplar (
  id uuid primary key default gen_random_uuid(),
  hoca_id uuid not null references public.profiller (id),
  ad text not null,
  aciklama text,
  renk text not null default '#2563eb',
  arsivlendi_at timestamptz,
  created_at timestamptz not null default now()
);

comment on column public.gruplar.arsivlendi_at is 'null ise grup aktif. Dolu ise arşivlenmiş, geri alınabilir.';

create index gruplar_hoca_id_idx on public.gruplar (hoca_id);

create table public.ogrenciler (
  id uuid primary key default gen_random_uuid(),
  hoca_id uuid not null references public.profiller (id),
  ad_soyad text not null,
  telefon text,
  veli_ad text,
  veli_telefon text,
  ders_ucreti numeric(10, 2) not null check (ders_ucreti >= 0),
  -- Bir öğrenci aynı anda en fazla 1 grupta olabilir.
  -- Grup silinirse (grup_id set null) öğrenci "grupsuz" kalır, kaybolmaz.
  grup_id uuid references public.gruplar (id) on delete set null,
  notlar text,
  arsivlendi_at timestamptz,
  created_at timestamptz not null default now()
);

comment on column public.ogrenciler.arsivlendi_at is 'null ise öğrenci aktif. Dolu ise arşivlenmiş; borcu varsa borç listesinde "Arşivde" etiketiyle görünmeye devam eder.';

create index ogrenciler_hoca_id_idx on public.ogrenciler (hoca_id);
create index ogrenciler_grup_id_idx on public.ogrenciler (grup_id);

alter table public.gruplar enable row level security;
alter table public.ogrenciler enable row level security;

create policy "hoca_kendi_gruplarini_yonetir" on public.gruplar
  for all
  using (hoca_id = auth.uid())
  with check (hoca_id = auth.uid());

create policy "yonetici_tum_gruplari_gorur" on public.gruplar
  for select
  using (public.is_yonetici());

create policy "hoca_kendi_ogrencilerini_yonetir" on public.ogrenciler
  for all
  using (hoca_id = auth.uid())
  with check (hoca_id = auth.uid());

create policy "yonetici_tum_ogrencileri_gorur" on public.ogrenciler
  for select
  using (public.is_yonetici());

-- Bir öğrenci yalnızca KENDİ hocasına ait bir gruba atanabilir.
-- Çoklu hoca izolasyonunu RLS'ye ek olarak veritabanı seviyesinde de garanti eder.
create or replace function public.ogrenci_grup_hoca_kontrolu()
returns trigger
language plpgsql
as $$
begin
  if new.grup_id is not null and not exists (
    select 1 from public.gruplar
    where id = new.grup_id and hoca_id = new.hoca_id
  ) then
    raise exception 'Öğrenci yalnızca kendi hocasına ait bir gruba eklenebilir.';
  end if;
  return new;
end;
$$;

create trigger ogrenciler_grup_hoca_kontrolu
  before insert or update on public.ogrenciler
  for each row execute function public.ogrenci_grup_hoca_kontrolu();
