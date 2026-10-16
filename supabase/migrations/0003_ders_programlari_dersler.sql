-- Tekrarlayan haftalık ders programları ve takvimdeki her bir ders.

create table public.ders_programlari (
  id uuid primary key default gen_random_uuid(),
  hoca_id uuid not null references public.profiller (id),
  grup_id uuid not null references public.gruplar (id) on delete cascade,
  -- ISO haftanın günü: 1 = Pazartesi ... 7 = Pazar
  haftanin_gunu smallint not null check (haftanin_gunu between 1 and 7),
  baslangic_saati time not null,
  bitis_saati time not null check (bitis_saati > baslangic_saati),
  -- Programın ilk geçerli olduğu tarih (dersler bu tarihten itibaren üretilir).
  baslangic_tarihi date not null,
  -- null ise program süresiz devam eder.
  bitis_tarihi date,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  check (bitis_tarihi is null or bitis_tarihi >= baslangic_tarihi)
);

create index ders_programlari_hoca_id_idx on public.ders_programlari (hoca_id);
create index ders_programlari_grup_id_idx on public.ders_programlari (grup_id);

create table public.dersler (
  id uuid primary key default gen_random_uuid(),
  hoca_id uuid not null references public.profiller (id),
  -- Geçmişi olan bir grup kalıcı olarak silinemez (ON DELETE RESTRICT).
  grup_id uuid not null references public.gruplar (id) on delete restrict,
  -- Tek seferlik derste null. Tekrarlayan derste üretildiği programa işaret eder.
  program_id uuid references public.ders_programlari (id) on delete set null,
  tarih date not null,
  baslangic_saati time not null,
  bitis_saati time not null check (bitis_saati > baslangic_saati),
  durum text not null default 'planli' check (durum in ('planli', 'yapildi', 'iptal')),
  konu text,
  created_at timestamptz not null default now(),
  -- Aynı programdan aynı tarihte iki ders üretilemez (üretim fonksiyonunun idempotentliğini sağlar).
  unique (program_id, tarih)
);

create index dersler_hoca_id_tarih_idx on public.dersler (hoca_id, tarih);
create index dersler_grup_id_idx on public.dersler (grup_id);

alter table public.ders_programlari enable row level security;
alter table public.dersler enable row level security;

create policy "hoca_kendi_programlarini_yonetir" on public.ders_programlari
  for all
  using (hoca_id = auth.uid())
  with check (hoca_id = auth.uid());

create policy "yonetici_tum_programlari_gorur" on public.ders_programlari
  for select
  using (public.is_yonetici());

create policy "hoca_kendi_derslerini_yonetir" on public.dersler
  for all
  using (hoca_id = auth.uid())
  with check (hoca_id = auth.uid());

create policy "yonetici_tum_dersleri_gorur" on public.dersler
  for select
  using (public.is_yonetici());

-- Program yalnızca KENDİ hocasına ait bir gruba bağlanabilir.
create or replace function public.program_grup_hoca_kontrolu()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.gruplar
    where id = new.grup_id and hoca_id = new.hoca_id
  ) then
    raise exception 'Program yalnızca kendi hocasına ait bir gruba bağlanabilir.';
  end if;
  return new;
end;
$$;

create trigger ders_programlari_grup_hoca_kontrolu
  before insert or update on public.ders_programlari
  for each row execute function public.program_grup_hoca_kontrolu();

-- Ders yalnızca KENDİ hocasına ait bir gruba (ve varsa programa) bağlanabilir.
create or replace function public.ders_grup_hoca_kontrolu()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.gruplar
    where id = new.grup_id and hoca_id = new.hoca_id
  ) then
    raise exception 'Ders yalnızca kendi hocasına ait bir gruba bağlanabilir.';
  end if;

  if new.program_id is not null and not exists (
    select 1 from public.ders_programlari
    where id = new.program_id and hoca_id = new.hoca_id
  ) then
    raise exception 'Ders yalnızca kendi hocasına ait bir programa bağlanabilir.';
  end if;

  return new;
end;
$$;

create trigger dersler_grup_hoca_kontrolu
  before insert or update on public.dersler
  for each row execute function public.ders_grup_hoca_kontrolu();

-- Verilen tarih aralığı için aktif programlardan eksik dersleri üretir.
-- Idempotenttir: unique(program_id, tarih) sayesinde aynı ders iki kez üretilmez.
-- SECURITY INVOKER (varsayılan): yalnızca çağıran hocanın KENDİ programlarını
-- okuyabilmesi ve kendi hoca_id'si ile ders ekleyebilmesi RLS tarafından garanti edilir.
create or replace function public.dersleri_uret(p_baslangic date, p_bitis date)
returns void
language plpgsql
as $$
declare
  r record;
  d date;
  gun smallint;
begin
  for r in
    select *
    from public.ders_programlari
    where hoca_id = auth.uid()
      and aktif
      and baslangic_tarihi <= p_bitis
      and (bitis_tarihi is null or bitis_tarihi >= p_baslangic)
  loop
    d := greatest(p_baslangic, r.baslangic_tarihi);

    -- d'yi programın haftanın gününe hizala.
    gun := extract(isodow from d)::smallint;
    if gun <> r.haftanin_gunu then
      d := d + ((r.haftanin_gunu - gun + 7) % 7);
    end if;

    while d <= p_bitis and (r.bitis_tarihi is null or d <= r.bitis_tarihi) loop
      insert into public.dersler (hoca_id, grup_id, program_id, tarih, baslangic_saati, bitis_saati)
      values (r.hoca_id, r.grup_id, r.id, d, r.baslangic_saati, r.bitis_saati)
      on conflict (program_id, tarih) do nothing;

      d := d + 7;
    end loop;
  end loop;
end;
$$;

comment on function public.dersleri_uret(date, date) is 'Takvim bir tarih aralığı görüntülediğinde çağrılır; aktif tekrarlayan programlardan eksik ders kayıtlarını üretir.';

revoke execute on function public.dersleri_uret(date, date) from public;
grant execute on function public.dersleri_uret(date, date) to authenticated;
