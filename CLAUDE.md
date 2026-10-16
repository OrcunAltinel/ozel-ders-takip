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
- [ ] **Aşama 4 — Ana yerleşim + Gruplar ve Öğrenciler** (sıradaki)
- [ ] **Aşama 5 — Dersler ve Takvim**
- [ ] **Aşama 6 — Yoklama ve Bugün sayfası**
- [ ] **Aşama 7 — Ödemeler ve Borçlar**
- [ ] **Aşama 8 — Arşivleme ve kalıcı silme**
- [ ] **Aşama 9 — Yönetim paneli**
- [ ] **Aşama 10 — Son kontrol** (RLS testi, ücret senaryoları, README)

## Veritabanı şeması (özet)

`profiller` (hoca/yonetici) → `gruplar`, `ogrenciler` → `ders_programlari`,
`dersler` → `yoklamalar`, `odemeler` → view `ogrenci_bakiyeleri`.

Önerilen şemaya göre eklenen sağlamlaştırmalar:
- `dersler.grup_id`, `yoklamalar/odemeler.ogrenci_id` → `ON DELETE RESTRICT`
  (geçmişi olan kayıt kalıcı silinemez kuralını DB seviyesinde garanti eder).
- Çapraz-hoca tutarlılık trigger'ları: bir hocanın `grup_id`/`ogrenci_id`/
  `program_id` alanına başka hocaya ait bir kayıt bağlanamaz.
- `yoklamalar.ucret`: ilk INSERT'te `ogrenciler.ders_ucreti`'nden kopyalanır,
  sonraki her UPDATE'te eski değer korunur (trigger ile, istemci ne
  gönderirse göndersin).
- `dersleri_uret(p_baslangic, p_bitis)`: tekrarlayan programlardan eksik
  dersleri idempotent üretir (`unique(program_id, tarih)` sayesinde).
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
8. **npm install'lar `--legacy-peer-deps` ile yapılıyor** (zod v3/v4 ve
   React 19 ekosistemindeki peer dependency sürtüşmeleri nedeniyle).

## Komutlar

```bash
npm run dev              # geliştirme sunucusu (Turbopack)
npm run build             # production build (webpack)
npm run lint               # eslint
npm run ilk-yonetici -- --kullanici <ad> --sifre <sifre> --ad "<Ad Soyad>"
```

## Ortam değişkenleri

`.env.local` (gitignore'da, repoya gitmez): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
`.env.example` repoda, placeholder değerlerle.

**Supabase Dashboard'da yapılması gereken**: Authentication → Providers →
Email → **"Allow new users to sign up" kapatılmalı** (kayıt sayfası yok,
kullanıcılar sadece `ilk-yonetici` scripti veya Yönetim panelinden eklenir).

## Yerelleştirme kuralları (hatırlatma)

- Tüm arayüz Türkçe, saat dilimi `Europe/Istanbul`, 24 saat formatı,
  TL para formatı (`Intl.NumberFormat('tr-TR', ...)`).
- DB tablo/kolon adları Türkçe kelimeler ama **Türkçe karakter yok**
  (`ogrenci`, `odeme`, `once` vb.).
