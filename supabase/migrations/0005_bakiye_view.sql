-- Öğrenci bazında güncel bakiye: toplam tahakkuk (gelinen dersler) - toplam ödeme.
-- security_invoker: view, onu sorgulayan kullanıcının RLS'si ile çalışır
-- (hoca sadece kendi öğrencilerini, yonetici hepsini salt okunur görür).

create view public.ogrenci_bakiyeleri
with (security_invoker = true) as
select
  o.id as ogrenci_id,
  o.hoca_id,
  coalesce(tahakkuk.toplam, 0)::numeric(10, 2) as toplam_tahakkuk,
  coalesce(odeme.toplam, 0)::numeric(10, 2) as toplam_odeme,
  (coalesce(tahakkuk.toplam, 0) - coalesce(odeme.toplam, 0))::numeric(10, 2) as bakiye
from public.ogrenciler o
left join (
  select ogrenci_id, sum(ucret) as toplam
  from public.yoklamalar
  where durum = 'geldi'
  group by ogrenci_id
) tahakkuk on tahakkuk.ogrenci_id = o.id
left join (
  select ogrenci_id, sum(tutar) as toplam
  from public.odemeler
  group by ogrenci_id
) odeme on odeme.ogrenci_id = o.id;

comment on view public.ogrenci_bakiyeleri is 'bakiye > 0: öğrenci borçlu. bakiye < 0: öğrenci alacaklı (fazla ödeme).';
