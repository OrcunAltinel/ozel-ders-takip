-- Yoklamalar ve ödemeler.

create table public.yoklamalar (
  id uuid primary key default gen_random_uuid(),
  hoca_id uuid not null references public.profiller (id),
  ders_id uuid not null references public.dersler (id) on delete cascade,
  -- Geçmiş yoklaması olan bir öğrenci kalıcı olarak silinemez (ON DELETE RESTRICT).
  ogrenci_id uuid not null references public.ogrenciler (id) on delete restrict,
  durum text not null check (durum in ('geldi', 'gelmedi')),
  -- İlk kayıtta ogrenciler.ders_ucreti'nden kopyalanır, sonra asla değişmez (bkz. trigger).
  ucret numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ders_id, ogrenci_id)
);

create index yoklamalar_hoca_id_idx on public.yoklamalar (hoca_id);
create index yoklamalar_ogrenci_id_idx on public.yoklamalar (ogrenci_id);

create table public.odemeler (
  id uuid primary key default gen_random_uuid(),
  hoca_id uuid not null references public.profiller (id),
  -- Geçmiş ödemesi olan bir öğrenci kalıcı olarak silinemez (ON DELETE RESTRICT).
  ogrenci_id uuid not null references public.ogrenciler (id) on delete restrict,
  tutar numeric(10, 2) not null check (tutar > 0),
  tarih date not null,
  odeme_yontemi text not null check (odeme_yontemi in ('nakit', 'havale', 'diger')),
  aciklama text,
  created_at timestamptz not null default now()
);

create index odemeler_hoca_id_tarih_idx on public.odemeler (hoca_id, tarih);
create index odemeler_ogrenci_id_idx on public.odemeler (ogrenci_id);

alter table public.yoklamalar enable row level security;
alter table public.odemeler enable row level security;

create policy "hoca_kendi_yoklamalarini_yonetir" on public.yoklamalar
  for all
  using (hoca_id = auth.uid())
  with check (hoca_id = auth.uid());

create policy "yonetici_tum_yoklamalari_gorur" on public.yoklamalar
  for select
  using (public.is_yonetici());

create policy "hoca_kendi_odemelerini_yonetir" on public.odemeler
  for all
  using (hoca_id = auth.uid())
  with check (hoca_id = auth.uid());

create policy "yonetici_tum_odemeleri_gorur" on public.odemeler
  for select
  using (public.is_yonetici());

-- Yoklama yalnızca KENDİ hocasına ait ders ve öğrenciye eklenebilir.
-- Ücret, ilk kayıtta öğrencinin güncel ders_ucreti'nden kopyalanır;
-- sonraki güncellemelerde (ör. gelmedi -> geldi) eski ücret korunur, yeniden hesaplanmaz.
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
    from public.ogrenciler
    where id = new.ogrenci_id;
  else
    new.ucret := old.ucret;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger yoklamalar_once_islemler
  before insert or update on public.yoklamalar
  for each row execute function public.yoklama_once_islemler();

-- Ödeme yalnızca KENDİ hocasına ait bir öğrenciye eklenebilir.
create or replace function public.odeme_hoca_kontrolu()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.ogrenciler
    where id = new.ogrenci_id and hoca_id = new.hoca_id
  ) then
    raise exception 'Ödeme yalnızca kendi hocasına ait bir öğrenciye eklenebilir.';
  end if;
  return new;
end;
$$;

create trigger odemeler_hoca_kontrolu
  before insert or update on public.odemeler
  for each row execute function public.odeme_hoca_kontrolu();
