-- Aşama 8: grup arşivleme.
-- Grubu tek işlemde (atomik) arşivler:
--   1) aktif haftalık programları bugün itibarıyla sonlandırır
--      (bugünden sonraki yoklamasız dersleri silinir),
--   2) bugünden sonraki tek seferlik yoklamasız dersleri siler,
--   3) gruptaki aktif öğrencileri ya grupsuz bırakır ya da onları da arşivler,
--   4) grubu arşivler.
-- Geçmiş dersler ve yoklamalar olduğu gibi kalır.
-- SECURITY INVOKER: yalnızca çağıran hocanın kendi kayıtları etkilenir (RLS).
create or replace function public.grubu_arsivle(
  p_grup_id uuid,
  p_ogrencileri_de_arsivle boolean
)
returns void
language plpgsql
as $$
declare
  bugun date := (now() at time zone 'Europe/Istanbul')::date;
  p record;
begin
  if not exists (
    select 1 from public.gruplar
    where id = p_grup_id and hoca_id = auth.uid() and arsivlendi_at is null
  ) then
    raise exception 'Grup bulunamadı.';
  end if;

  for p in
    select id from public.ders_programlari
    where grup_id = p_grup_id
      and hoca_id = auth.uid()
      and (bitis_tarihi is null or bitis_tarihi > bugun)
  loop
    perform public.programi_sonlandir(p.id, bugun);
  end loop;

  delete from public.dersler d
  where d.grup_id = p_grup_id
    and d.hoca_id = auth.uid()
    and d.tarih > bugun
    and d.durum in ('planli', 'iptal')
    and not exists (select 1 from public.yoklamalar y where y.ders_id = d.id);

  if p_ogrencileri_de_arsivle then
    update public.ogrenciler
    set arsivlendi_at = now()
    where grup_id = p_grup_id and hoca_id = auth.uid() and arsivlendi_at is null;
  else
    update public.ogrenciler
    set grup_id = null
    where grup_id = p_grup_id and hoca_id = auth.uid() and arsivlendi_at is null;
  end if;

  update public.gruplar
  set arsivlendi_at = now()
  where id = p_grup_id;
end;
$$;

comment on function public.grubu_arsivle(uuid, boolean) is 'Grubu arşivler: programları bugün sonlandırır, gelecekteki yoklamasız dersleri siler, öğrencileri grupsuz bırakır veya arşivler.';

revoke execute on function public.grubu_arsivle(uuid, boolean) from public;
grant execute on function public.grubu_arsivle(uuid, boolean) to authenticated;
