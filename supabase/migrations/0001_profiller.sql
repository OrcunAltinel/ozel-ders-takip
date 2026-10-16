-- Kullanıcı profilleri (hoca / yonetici).
-- id, auth.users.id ile birebir eşleşir.

create table public.profiller (
  id uuid primary key references auth.users (id) on delete cascade,
  kullanici_adi text not null unique,
  ad_soyad text not null,
  rol text not null check (rol in ('hoca', 'yonetici')),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.profiller is 'auth.users ile birebir eşleşen kullanıcı profilleri. Kullanıcı yönetimi (oluşturma, şifre sıfırlama, pasifleştirme) yalnızca service role ile sunucu tarafında yapılır.';

alter table public.profiller enable row level security;

-- RLS politikalarında sonsuz özyinelemeyi önlemek için security definer fonksiyon.
-- search_path sabitlenir (güvenlik: search_path hijack koruması).
create or replace function public.is_yonetici()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiller
    where id = auth.uid() and rol = 'yonetici'
  );
$$;

comment on function public.is_yonetici() is 'Oturum açmış kullanıcının yonetici rolünde olup olmadığını döner. RLS politikalarında kullanılır.';

grant execute on function public.is_yonetici() to authenticated;

-- Kullanıcı sadece kendi profilini görür.
create policy "kendi_profilini_gorur" on public.profiller
  for select
  using (id = auth.uid());

-- Yonetici tüm profilleri görür (salt okunur; yazma işlemleri service role ile yapılır).
create policy "yonetici_tum_profilleri_gorur" on public.profiller
  for select
  using (public.is_yonetici());
