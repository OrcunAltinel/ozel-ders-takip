-- Öğrenci bazlı eski ücret sütunu kaldırılır. 0006'dan beri kullanılmıyordu;
-- değerler o migration'da hoca_ayarlari.ders_ucreti'ne taşınmıştı.
-- Yoklama ücretleri yoklamalar.ucret'te ayrıca saklandığı için geçmiş
-- borçlar etkilenmez.
alter table public.ogrenciler drop column ders_ucreti;
