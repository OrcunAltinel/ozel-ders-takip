-- Aşama 5: takvim için ders üretimi sağlamlaştırmaları.

-- 1) Programdan üretilen bir ders başka bir tarihe taşınabilir. Üretimin
--    idempotent kalması (taşınan dersin eski tarihine yeniden ders
--    üretilmemesi) için dersin programdaki ASIL tarihi ayrı tutulur ve
--    benzersizlik bu sütun üzerinden sağlanır.
alter table public.dersler add column program_tarihi date;

comment on column public.dersler.program_tarihi is 'Programdan üretilen dersin programdaki asıl tarihi (ders başka güne taşınsa da değişmez). Tek seferlik derste null.';

update public.dersler set program_tarihi = tarih where program_id is not null;

alter table public.dersler drop constraint dersler_program_id_tarih_key;
alter table public.dersler
  add constraint dersler_program_id_program_tarihi_key unique (program_id, program_tarihi);
alter table public.dersler
  add constraint dersler_program_tarihi_zorunlu
  check (program_id is null or program_tarihi is not null);

-- 2) Ders üretimi program_tarihi'ni doldurur; aşırı geniş aralıklar reddedilir.
create or replace function public.dersleri_uret(p_baslangic date, p_bitis date)
returns void
language plpgsql
as $$
declare
  r record;
  d date;
  gun smallint;
begin
  if p_bitis < p_baslangic then
    return;
  end if;

  if p_bitis - p_baslangic > 100 then
    raise exception 'Ders üretim aralığı en fazla 100 gün olabilir.';
  end if;

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
      insert into public.dersler
        (hoca_id, grup_id, program_id, program_tarihi, tarih, baslangic_saati, bitis_saati)
      values
        (r.hoca_id, r.grup_id, r.id, d, d, r.baslangic_saati, r.bitis_saati)
      on conflict (program_id, program_tarihi) do nothing;

      d := d + 7;
    end loop;
  end loop;
end;
$$;

-- 3) Yoklaması olan bir ders silinemez (yoklamalar ON DELETE CASCADE ile
--    sessizce kaybolup borç geçmişini bozmasın diye).
create or replace function public.yoklamali_ders_silinemez()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.yoklamalar where ders_id = old.id) then
    raise exception 'Yoklaması alınmış bir ders silinemez.';
  end if;
  return old;
end;
$$;

create trigger dersler_yoklamali_silinemez
  before delete on public.dersler
  for each row execute function public.yoklamali_ders_silinemez();

-- 4) Bir programın verilen tarihten (dahil) sonraki, henüz yoklaması
--    alınmamış planlı/iptal derslerini siler. Program düzenlendiğinde veya
--    sonlandırıldığında çağrılır; silinen tarihler gerekirse yeni program
--    bilgileriyle yeniden üretilir. Silinen ders sayısını döner.
create or replace function public.program_derslerini_temizle(p_program_id uuid, p_tarihten date)
returns integer
language plpgsql
as $$
declare
  adet integer;
begin
  delete from public.dersler d
  where d.program_id = p_program_id
    and d.hoca_id = auth.uid()
    and d.program_tarihi >= p_tarihten
    and d.durum in ('planli', 'iptal')
    and not exists (select 1 from public.yoklamalar y where y.ders_id = d.id);

  get diagnostics adet = row_count;
  return adet;
end;
$$;

revoke execute on function public.program_derslerini_temizle(uuid, date) from public;
grant execute on function public.program_derslerini_temizle(uuid, date) to authenticated;

-- 5) Programı verilen son ders tarihinde sonlandırır. Sonraki dersler
--    temizlenir. Programa ait hiç ders kalmadıysa (ör. yanlışlıkla
--    oluşturulmuşsa) veya son tarih başlangıçtan önceyse program tamamen
--    silinir; kalan geçmiş dersler takvimde tek seferlik ders olarak kalır.
--    Dönüş: 'silindi' veya 'sonlandirildi'.
create or replace function public.programi_sonlandir(p_program_id uuid, p_son_tarih date)
returns text
language plpgsql
as $$
declare
  p public.ders_programlari;
begin
  select * into p
  from public.ders_programlari
  where id = p_program_id and hoca_id = auth.uid();

  if not found then
    raise exception 'Program bulunamadı.';
  end if;

  perform public.program_derslerini_temizle(p_program_id, p_son_tarih + 1);

  if p_son_tarih < p.baslangic_tarihi
     or not exists (select 1 from public.dersler where program_id = p_program_id) then
    delete from public.ders_programlari where id = p_program_id;
    return 'silindi';
  end if;

  update public.ders_programlari
  set bitis_tarihi = p_son_tarih
  where id = p_program_id;
  return 'sonlandirildi';
end;
$$;

revoke execute on function public.programi_sonlandir(uuid, date) from public;
grant execute on function public.programi_sonlandir(uuid, date) to authenticated;
