# Özel Ders Takip Sistemi — Proje Notları

Bu dosya, projenin Claude Code ile birlikte nasıl geliştirildiğini, alınan
kararları ve ilerleme durumunu kaydeder. Yeni bir oturumda devam ederken
önce bu dosyayı oku.

## Proje tanımı

Özel ders hocaları (ve gizli bir "yonetici" süper kullanıcısı) için
yoklama, takvim ve borç takip web uygulaması. Öğrenciler/veliler sisteme
erişemez. Arayüz tamamen Türkçe. Sistem çoklu hocaya hazır (her veri
`hoca_id` ile ayrılır) ama şu an tek hoca kullanacak.

Tam gereksinim dokümanı (roller, sayfalar, ücret kuralları, aşama planı)
ilk kullanıcı mesajında verildi; bu dosya onun **özetini ve ilerleme
durumunu** tutar, yerini almaz.

## Teknoloji yığını

- **Next.js 15.5.28** (App Router, `src/` dizini) + TypeScript (strict)
- **Tailwind CSS v4** (PostCSS tabanlı, `postcss.config.mjs`) + **shadcn/ui**
  (`style: "base-nova"`, Base UI tabanlı — Radix değil)
- **Supabase** (Postgres + Auth + RLS), `@supabase/ssr` ile cookie tabanlı oturum
- **react-hook-form + zod** (zod v4)
- **FullCalendar** `6.1.22` (core/react/daygrid/timegrid/interaction/list — hepsi
  aynı majör sürümde sabitlendi, bkz. aşağıdaki not)
- **date-fns + date-fns-tz** (`Europe/Istanbul`)
- Paket yöneticisi: npm

### Supabase proje bilgisi
- Proje ref: `watzyrqlnlouhjhitlby`
- Supabase MCP sunucusu `.mcp.json`'da tanımlı (database, docs, development)

## Aşama planı ve ilerleme durumu

Kullanıcıyla 10 aşamalı bir plan üzerinde çalışılıyor; her aşama sonunda
özet + test talimatı + onay bekleniyor.

- [x] **Aşama 1 — Kurulum**: Next.js projesi, Tailwind, shadcn/ui, Supabase
  istemcileri (`client.ts`/`server.ts`/`admin.ts`), klasör yapısı, `.env.example`.
- [x] **Aşama 2 — Veritabanı**: Tüm tablolar, `ogrenci_bakiyeleri` view'ı,
  `is_yonetici()`, RLS politikaları, indeksler, tetikleyiciler. Migration
  dosyaları `supabase/migrations/0001-0005` ve gerçek Supabase projesine
  uygulandı. `src/types/database.types.ts` şemadan üretildi.
- [x] **Aşama 3 — Kimlik doğrulama**: `/giris` sayfası, kullanıcı adı↔e-posta
  dönüşümü, "Beni hatırla" (oturum cookie'si vs kalıcı cookie), middleware
  (giriş yönlendirmesi), `npm run ilk-yonetici` scripti. Uçtan uca test
  edildi (gerçek Supabase projesinde geçici bir hesapla: giriş, pasif/banned
  kullanıcı reddi, middleware yönlendirmesi — sonra temizlendi).
- [x] **Aşama 4 — Ana yerleşim + Gruplar ve Öğrenciler**: `src/app/(uygulama)/` route grubu + ortak layout (masaüstünde
  kenar çubuğu, mobilde Sheet menü, kullanıcı menüsü/çıkış). `oturumGetir()`
  (`src/lib/auth/oturum.ts`, React `cache`) profili yükler; profili olmayan
  veya pasif kullanıcıyı `/cikis` route handler'ına gönderir. Gruplar:
  liste (kart), oluştur/düzenle (ad, açıklama, renk), detay sayfasında
  öğrenci ekle/taşı/çıkar. Öğrenciler: liste (istemci tarafı arama + grup
  filtresi, bakiye kolonu), oluştur/düzenle, detay (bilgiler + bakiye özeti).
  Henüz yazılmamış sayfalar (`Yakinda` bileşeni) "Aşama X'te eklenecek"
  gösterir. `/yonetim` yönetici olmayanlara 404 döner. Arşivleme/silme
  Aşama 8'e bırakıldı (listeler `arsivlendi_at is null` filtreler).
  **Kullanıcı isteğiyle değişti:** ders ücreti öğrenci bazında DEĞİL, hoca
  bazında tek bir değer (`hoca_ayarlari.ders_ucreti`, `/ayarlar` sayfası);
  tüm öğrenciler için aynı. Öğrenci formunda ücret alanı yok.
- [x] **Aşama 5 — Dersler ve Takvim**: (kullanıcı isteğiyle: ders kutularında
  her görünümde "10:00–16:30" biçiminde bitiş saati de gösterilir, `eventContent`; saatler `arg.event.start/end`den okunur — seçim taslağında `extendedProps.ders` YOKTUR)
  `/takvim` (FullCalendar; masaüstünde hafta, mobilde liste görünümü,
  `next/dynamic` ile `ssr:false`). Boş saate tıkla → yeni ders (tek seferlik
  veya "Her hafta tekrarla" → `ders_programlari` satırı). Derse tıkla →
  detay (iptal et/geri al, düzenle, tek seferlikse sil). Sürükle-bırak /
  boyutlandırma `dersGuncelle` çağırır. Takvim her aralık değişiminde
  `takvimDersleriniGetir` server action'ını çağırır (önce `dersleri_uret`).
  Grup detay sayfasında "Haftalık program" kartı: ekle / düzenle
  (bugünden itibaren geçerli) / sonlandır. Migration 0007.
- [x] **Aşama 6 — Yoklama ve Bugün sayfası**:
  `/` (Bugün): bugünün ve son 30 günün eksik derslerini üretir
  (`dersleri_uret`), bugünün dersleri için kart başına yoklama formu
  (Geldi/Gelmedi, varsayılan "geldi"), sağda son 30 günün yoklaması
  alınmamış dersleri. `/dersler/[id]`: tek dersin yoklama sayfası (takvim
  detayındaki "Yoklama al/gör" ve öğrenci ders geçmişi buraya bağlanır).
  Veri: `src/lib/yoklama-verisi.ts` (grubun güncel üyeleri + o derste
  yoklaması olup gruptan ayrılmış öğrenciler). Action'lar
  `src/actions/yoklama.ts`: `yoklamaKaydet` (upsert `ders_id,ogrenci_id`,
  ders → `yapildi`; iptal/gelecek ders ve ücret ayarı yoksa reddeder),
  `yoklamayiGeriAl` (yoklamaları siler, ders → `planli`). Öğrenci detayında
  "Ders geçmişi" tablosu.
- [x] **Aşama 7 — Ödemeler ve Borçlar**:
  `/odemeler`: `?ay=yyyy-MM` ile ay ay gezinme, aylık toplam + yönteme göre
  dağılım, ödeme ekle/düzenle/sil (`src/actions/odemeler.ts`; ileri tarih
  reddedilir). `/borclar`: `ogrenci_bakiyeleri` view'ından borçlular
  (arşivdekiler "Arşivde" etiketiyle), toplam alacak, satır başına
  "Ödeme al" (borcun tamamı önerilir) ve veli (yoksa öğrenci) telefonuna
  `wa.me` hatırlatma bağlantısı; fazla ödeme yapanlar ayrı listede.
  Öğrenci detayında ödeme geçmişi + "Ödeme al". Ödeme formundaki öğrenci
  listesi `odemeOgrenciSecenekleri()`: aktifler + bakiyesi sıfır olmayan
  arşivdekiler. Öğrenci detay sayfası arşivdeki öğrenciyi de gösterir
  (düzenleme kapalı; `ogrenciGuncelle` de arşivdekini reddeder).
- [x] **Aşama 8 — Arşivleme ve kalıcı silme**:
  `src/actions/arsiv.ts`. Öğrenci: detay sayfasından "Arşivle"; arşivdeyken
  "Arşivden çıkar" (eski grubu arşivdeyse grupsuz döner) ve geçmişi yoksa
  "Kalıcı sil". Grup: detay sayfasından "Arşivle" → `grubu_arsivle()` (0008,
  tek işlem): aktif programları bugün `programi_sonlandir` ile bitirir,
  gelecekteki yoklamasız dersleri siler, gruptaki aktif öğrencileri grupsuz
  bırakır veya ("Öğrencileri de arşivle") arşivler. Grup arşivden çıkınca
  program/öğrenci geri gelmez. `/arsiv`: arşivdeki öğrenciler (bakiye) ve
  gruplar (ders sayısı); kalıcı silme YALNIZCA arşivdeki ve geçmişi
  (yoklama/ödeme; grup için ders) olmayan kayıtlar için — DB'de de
  `ON DELETE RESTRICT`. Ortak onay bileşeni `components/arsiv/onay-dialog.tsx`.
- [x] **Aşama 9 — Yönetim paneli**: `/yonetim`
  (yalnızca rol=yonetici; diğerlerine 404, menüde görünmez): hesap listesi
  (rol/durum, aktif öğrenci, alacak, son giriş — `auth.admin.listUsers`),
  "Yeni hesap" (kullanıcı adı/ad/şifre üret/rol), satır menüsü: bilgileri
  düzenle (ad, rol; kendi yönetici rolünü düşüremez), şifre belirle,
  pasifleştir/aktifleştir (profiller.aktif + Auth `ban_duration`; kendini
  pasifleştiremez). `/yonetim/[id]`: hocanın verilerinin SALT OKUNUR özeti
  (RLS'deki yönetici select politikalarıyla). Action'lar `src/actions/yonetim.ts`
  service role kullanır ve İLK satırda `yoneticiOturumu()` kontrolü yapar
  (`src/lib/auth/yonetici.ts`). Giriş hatası pasif hesapta da genel mesaj
  verir (Supabase `user_banned`'ı yanlış şifrede de döndürüyor → ayrı mesaj
  hesabın varlığını sızdırırdı). Türkçe 404: `app/not-found.tsx` ve
  `app/(uygulama)/not-found.tsx`.
- [x] **Aşama 10 — Son kontrol**:
  `npm run kontrol-testi` (`scripts/kontrol-testi.ts`, kalıcı): gerçek
  projede geçici `kontrol_*` hesaplarla RLS izolasyonu, yönetici salt
  okuma, rol yükseltme engeli, ücret senaryoları ve silme korumalarını
  doğrular (39 kontrol), sonunda her şeyi siler. Tam README (kurulum,
  Auth ayarları, dağıtım). Migration 0009: RLS'de `(select auth.uid())` /
  `(select is_yonetici())` + fonksiyonlarda sabit `search_path`.
  **Kullanıcı isteğiyle ek:** (1) Performans: bkz. not 12. (2) Koyu mod:
  `next-themes` (`components/tema/`), üst çubukta Açık/Koyu/Sistem seçici;
  `<html suppressHydrationWarning>`.

**10 aşamanın tamamı bitti** (son commit'ler GitHub'da:
`github.com/OrcunAltinel/ozel-ders-takip`, `master`). Son migration: 0011.

## Oturum sonrası değişiklikler (2026-10-17)

Plan dışı, kullanıcı istekleriyle yapılan değişiklikler (hepsi `master`'da):

- **Güvenlik:** Giriş denemelerine IP başına hız sınırı
  (`src/lib/auth/giris-limiti.ts`, bellek-içi best-effort; serverless'te
  örnekler arası paylaşılmaz — ileride Redis/DB'ye taşınabilir). `postcss`
  transitive açığı `package.json` `overrides` ile 8.5.30'a çekildi (Next
  sürümü değişmedi; `npm audit` 0 açık). Kod güvenlik incelemesi yapıldı:
  RLS/trigger/service-role mimarisi sağlam bulundu, sömürülebilir açık yok.
- **Tasarım/erişilebilirlik** (Web Interface Guidelines denetimi): koyu modda
  `color-scheme` + `theme-color`; giriş sayfası `<h1>`; dialog/sheet "Kapat";
  `transition-all` → açık özellik listesi; "İçeriğe atla" skip link;
  yükleme metinlerinde `…`; öğrenci listesi filtreleri URL'ye yansıyor.
- **WhatsApp kaldırıldı:** Borçlar sayfasındaki `wa.me` hatırlatma bağlantısı
  silindi (telefon numarası gösterimi kaldı).
- **Ücret SAATLİK oldu (migration 0011):** `hoca_ayarlari.ders_ucreti` →
  `saatlik_ucret`. Yoklama ücreti artık `saatlik_ucret × ders süresi`
  (bitiş−başlangıç, saat). `yoklama_once_islemler` trigger'ı güncellendi
  (search_path sabit). Kayıtlı ücretler değişmezliğini korur. **Not:**
  rename sonrası eski ders-başı değer artık "saatlik" sayıldığından
  Ayarlar'dan doğru saatlik ücret yeniden girilmeli. Ücret yardımcısı
  `saatlikUcretGetir()`, şema `saatlikUcretSemasi`.
- **Kendi şifreni değiştirme:** Ayarlar'da "Şifre" kartı; `src/actions/hesap.ts`
  `sifreDegistir` mevcut şifreyi geçici istemciyle doğrular, sonra
  `auth.updateUser` (service role gerekmez).
- **Ödemelerde isme göre filtre:** `src/components/odemeler/odemeler-listesi.tsx`
  (Türkçe duyarlı, URL `?ad=`); aylık özet ay geneli kalır, liste süzülür.

**Devam noktası (buradan devam edilecek):**
- **ACİL:** Uygulamada Ayarlar → **Saatlik ücret**'e doğru saat başı ücret
  girilmeli (migration 0011 eski ders-başı değeri "saatlik" olarak bıraktı,
  bu yüzden yanlış; girilmeden yoklama ücretleri hatalı hesaplanır).
- Konuşulan sıradaki iş: **telefondan erişim** — kalıcı erişim için Vercel'e
  yayına alma (README "Dağıtım"); hızlı test için `npm run dev -- -H 0.0.0.0`
  + aynı Wi-Fi'de `http://<bilgisayar-LAN-IP>:3000`.
- Bu oturumun tüm işleri `master`'da ve GitHub'a push edildi (commit 4d1050a).

## Kalan işler (kullanıcı sonra halledecek)

Plan tamamlandı; aşağıdakiler kullanıcının kendi yapacağı veya ileride
istenirse ele alınacak işlerdir. Yeni oturumda kullanıcı bunlardan birini
isterse buradan devam et.

**Kullanıcının yapması gerekenler (yapılmadan yayına alınmamalı):**
- [x] **Supabase'te dışarıdan kaydı kapat:** Authentication → Sign In /
  Providers → Email → "Allow new users to sign up". **Kullanıcı 2026-10-17'de
  kapattığını bildirdi.**
- [ ] **Yayına alma (Vercel):** Adımlar README'de ("Dağıtım"): install
  command `npm install --legacy-peer-deps`, üç ortam değişkeni, fonksiyon
  bölgesini Supabase'e yakın seç (ör. `fra1`), Supabase Auth → URL
  Configuration → Site URL'ye yayın adresini yaz. Kullanıcı isterse birlikte
  yapılabilir.
- [ ] **Gerçek telefonda deneme:** Mobil görünüm (takvim liste görünümü,
  mobil menü, dialog'lar) gerçek cihazda test edilmedi; yalnızca masaüstü
  tarayıcıda dar görünümler kontrol edildi.
- [ ] **Gereksinim dokümanıyla karşılaştırma:** İlk kullanıcı mesajındaki
  tam gereksinim dokümanı Aşama 4'ten itibaren oturumlarda mevcut değildi;
  ayrıntılar bu dosyadaki özete ve kullanıcı geri bildirimlerine göre
  yapıldı. Kullanıcı dokümanda kaçan bir özellik görürse eklenecek.

**İsteğe bağlı fikirler (kullanıcıya önerildi, henüz istenmedi):**
- Yoklamada tek tıkla "hepsi geldi" / toplu yoklama
- Aylık rapor veya Excel/CSV dışa aktarma (tahsilat, ders sayıları)
- Veliye otomatik borç hatırlatması (şu an yalnızca elle WhatsApp bağlantısı)
- Ders notu / ödev takibi

**Gözlenen ama çözülmemiş küçük durum:** Aşama 6 testinde bir kez
"Yoklamayı geri al" işlemi veritabanında tamamlandığı halde arayüz birkaç
saniye beklemede kaldı; tekrar denemede yaşanmadı, sebebi bulunamadı.
Kullanıcı tekrar bildirirse incelenmeli.

## Veritabanı şeması (özet)

`profiller` (hoca/yonetici) → `gruplar`, `ogrenciler` → `ders_programlari`,
`dersler` → `yoklamalar`, `odemeler` → view `ogrenci_bakiyeleri`.

Önerilen şemaya göre eklenen sağlamlaştırmalar:
- `dersler.grup_id`, `yoklamalar/odemeler.ogrenci_id` → `ON DELETE RESTRICT`
  (geçmişi olan kayıt kalıcı silinemez kuralını DB seviyesinde garanti eder).
- Çapraz-hoca tutarlılık trigger'ları: bir hocanın `grup_id`/`ogrenci_id`/
  `program_id` alanına başka hocaya ait bir kayıt bağlanamaz.
- `yoklamalar.ucret`: ilk INSERT'te `hoca_ayarlari.ders_ucreti`'nden
  kopyalanır (ayar yoksa INSERT hata verir), sonraki her UPDATE'te eski
  değer korunur (trigger ile, istemci ne gönderirse göndersin).
  Eski öğrenci bazlı `ogrenciler.ders_ucreti` sütunu kullanıcı onayıyla
  0010'da kaldırıldı (0006'dan beri kullanılmıyordu).
- `dersleri_uret(p_baslangic, p_bitis)`: tekrarlayan programlardan eksik
  dersleri idempotent üretir. Benzersizlik `unique(program_id, program_tarihi)`
  üzerinden: `program_tarihi` dersin programdaki ASIL tarihidir, ders başka
  güne taşınsa da değişmez (aksi halde eski güne ders yeniden üretilirdi).
  En fazla 100 günlük aralık kabul eder.
- Yoklaması olan ders silinemez (trigger `dersler_yoklamali_silinemez`).
- `program_derslerini_temizle(program, tarihten)`: programın o tarihten
  sonraki yoklamasız planlı/iptal derslerini siler (program düzenlenince
  bugünden itibaren çağrılır, dersler yeni bilgilerle yeniden üretilir).
  `programi_sonlandir(program, son_tarih)`: sonrasını temizler; hiç dersi
  kalmadıysa programı siler, yoksa `bitis_tarihi` ayarlar.
- Programdan gelen tek bir ders SİLİNMEZ (yeniden üretilirdi), iptal edilir.
  Başlamış bir programın düzenlenmesinde `baslangic_tarihi` bugüne çekilir
  (geçmiş haftalara yeni günde ders üretilmesin diye).
- Her tabloda RLS: hoca kendi `hoca_id = auth.uid()` satırlarında tam CRUD,
  `is_yonetici()` (security definer) ile yönetici tüm satırları salt okur.

## Önemli teknik kararlar ve tuzaklar

1. **Next.js 16 → 15'e düşürüldü.** Next 16.4.2'de hem `middleware.ts` hem
   yeni `proxy.ts` kuralı dev sunucusunda güvenilmez çalışıyordu (bazen
   hiç tetiklenmiyor, bazen export adı hatası). **Next 15.5.28** (olgun,
   kararlı sürüm) kullanılıyor. Deneysel `cacheComponents`/
   `partialPrefetching` kapatıldı (gereksiz karmaşıklık).
2. **`middleware.ts` konumu kritik**: proje `src/` dizini kullandığı için
   dosya **`src/middleware.ts`** içinde olmalı, kökte DEĞİL. Kökte olursa
   webpack (production build ve `next dev` default'u) middleware'i
   **sessizce yok sayar** (hata vermez, sadece çalışmaz) — sadece
   Turbopack dev modu kökteki dosyayı tolere eder. `package.json`'daki
   `dev` script'i bu yüzden `next dev --turbopack` kullanıyor.
   Yardımcı dosya: `src/lib/supabase/middleware.ts` (`oturumuGuncelle`).
3. **Tailwind v4 kurulumu PostCSS tabanlı** (`@tailwindcss/postcss` +
   `postcss.config.mjs`), Turbopack'e özel yükleyici YOK — böylece hem
   webpack hem Turbopack ile sorunsuz çalışır.
4. **ESLint**: Next 15'in `eslint-config-next` paketi legacy (eslintrc)
   formatında; flat config'e `@eslint/eslintrc`'in `FlatCompat` yardımcısı
   ile köprüleniyor (`eslint.config.mjs`).
5. **shadcn/ui**: en güncel sürüm Radix yerine **Base UI** kullanıyor
   (`@base-ui/react`), `cn` paketi doğrudan import ediliyor, form bileşeni
   artık `form.tsx` değil **`field.tsx`** (Field/FieldLabel/FieldError
   primitifleri — react-hook-form'a `Controller`/`register` ile elle
   bağlanıyor).
6. **FullCalendar sürüm uyumsuzluğu**: `core`/`react` paketleri `7.x`'e
   geçmiş ama eklenti paketleri (`daygrid`/`timegrid`/`interaction`/`list`)
   hâlâ `6.x` — hepsi **`6.1.22`**'ye `--save-exact` ile sabitlendi.
7. **`server-only` paketi**: `src/lib/supabase/admin.ts` içinde kullanılıyor
   ama bu yüzden **tsx/node script'lerinden asla import edilmemeli**
   (`scripts/ilk-yonetici.ts` kendi admin istemcisini oluşturur, çünkü
   `server-only` paketi düz Node ortamında import anında throw eder).
8. **Uygulama kalıpları (Aşama 4'te oturdu)**: server action'lar
   `src/actions/*.ts`, `IslemSonucu` (`{hata}` | `{basarili: true}`) döner,
   girdiyi zod şemasıyla (`src/lib/validasyon/`) yeniden doğrular ve her
   sorguda RLS'ye ek olarak açıkça `.eq("hoca_id", kullanici.id)` filtreler
   (yönetici RLS ile herkesi okuyabildiği için bu filtre şart). Formlar
   dialog içinde, react-hook-form + `Controller`. Base UI `Select` boş
   string değer taşıyamaz → "grupsuz"/"tümü" için sentinel değer kullanılır;
   seçili etiketin görünmesi için `Select`'e `items` prop'u verilir.
   Tutar girişi `tutarCozumle()` ile ("750", "750,50", "1.250,50").
9. **`npm run build` çalışan `npm run dev`'i bozar** (ikisi de `.next`
   klasörünü kullanır; kullanıcının dev sunucusu 500 vermeye başlar). Test
   build'leri için `NEXT_DIST_DIR=.next-test npm run build` ve
   `NEXT_DIST_DIR=.next-test npx next start -p 3123` kullan (`next.config.ts`
   `distDir`'i bu env'den okur; `.next-*` gitignore/eslint'te yok sayılır).
   Next, bu build sırasında `tsconfig.json`'a `.next-test/types` ekler —
   commit'lemeden önce geri al. Kullanıcının tarayıcısında localhost'ta
   kendi oturumu açık olabilir (çerezler portlar arası paylaşılır).
10. **Font**: `globals.css`'teki `--font-sans` `var(--font-geist-sans)`'e
   işaret etmeli (Aşama 1'de kendine referans veriyordu → serif'e düşüyordu).
11. **npm install'lar `--legacy-peer-deps` ile yapılıyor** (zod v3/v4 ve
   React 19 ekosistemindeki peer dependency sürtüşmeleri nedeniyle).
12. **Performans (Supabase'e her gidiş-dönüş ~150 ms):** Oturum JWT'si
   `getClaims()` ile YEREL doğrulanır (proje ES256 asimetrik anahtar
   kullanıyor), middleware ve sayfalarda `getUser()` KULLANMA.
   `kimlikGetir()` (yalnızca kimlik, ağ isteği yok) salt okuyan sayfalar ve
   `lib/` yardımcıları içindir; `oturumGetir()` (+profil, pasif kontrolü)
   layout, yönetici kontrolleri ve veri değiştiren action'lar içindir.
   `(uygulama)/loading.tsx` geçişlerde anında iskelet gösterir. Ölçüm
   (production, ortanca): sayfalar ~440 ms → ~125 ms. `npm run dev` modu
   bunlardan çok daha yavaştır; hız değerlendirmesi production'da yapılmalı.

## Komutlar

```bash
npm run dev              # geliştirme sunucusu (Turbopack)
npm run build             # production build (webpack)
npm run lint               # eslint
npm run ilk-yonetici -- --kullanici <ad> --sifre <sifre> --ad "<Ad Soyad>"
npm run kontrol-testi     # RLS + ücret + silme kontrol testi (gerçek DB, geçici hesaplar)
```

## Ortam değişkenleri

`.env.local` (gitignore'da, repoya gitmez): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
`.env.example` repoda, placeholder değerlerle.

**Supabase Dashboard'da yapılması gereken**: Authentication → Providers →
Email → **"Allow new users to sign up" kapatılmalı** (kayıt sayfası yok,
kullanıcılar sadece `ilk-yonetici` scripti veya Yönetim panelinden eklenir).
Durumu "Kalan işler" bölümünde takip ediliyor.

## Yerelleştirme kuralları (hatırlatma)

- Tüm arayüz Türkçe, saat dilimi `Europe/Istanbul`, 24 saat formatı,
  TL para formatı (`Intl.NumberFormat('tr-TR', ...)`).
- DB tablo/kolon adları Türkçe kelimeler ama **Türkçe karakter yok**
  (`ogrenci`, `odeme`, `once` vb.).
