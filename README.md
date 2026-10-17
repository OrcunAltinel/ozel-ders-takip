# Özel Ders Takip Sistemi

Özel ders veren hocalar için yoklama, takvim ve borç takip uygulaması.
Öğrenciler/veliler sisteme giriş yapmaz; uygulamayı yalnızca hocalar ve
yönetici kullanır. Arayüz tamamen Türkçedir, tarih/saatler `Europe/Istanbul`
saat dilimine göre hesaplanır.

## Özellikler

- **Bugün:** Günün dersleri ve tek dokunuşla Geldi/Gelmedi yoklaması; son
  30 günde yoklaması unutulan dersler.
- **Takvim:** Haftalık / günlük / aylık / liste görünümü. Boş saate tıklayıp
  veya sürükleyip ders ekleme, dersleri sürükleyerek taşıma, iptal etme.
  Haftalık tekrarlayan dersler (program) otomatik oluşturulur.
- **Gruplar ve öğrenciler:** Her ders bir gruba aittir (tek öğrencili özel
  ders için de bir grup açılır). Öğrenci aynı anda en fazla bir gruptadır.
- **Ödemeler ve borçlar:** Ödeme alma/düzenleme/silme, aylık tahsilat
  özeti, borçlu öğrenciler listesi, veliye WhatsApp hatırlatma bağlantısı.
- **Arşiv:** Öğrenci/grup arşivleme ve geri alma; geçmişi olmayan
  kayıtların kalıcı silinmesi.
- **Yönetim paneli** (yalnızca yönetici): hesap oluşturma, şifre belirleme,
  pasifleştirme ve hocaların verilerini salt okunur inceleme.
- **Koyu mod:** Üst çubuktaki güneş/ay simgesinden Açık / Koyu / Sistem.
- **Çoklu hoca:** Her hocanın verisi veritabanı seviyesinde (RLS) ayrıdır.

## Ücret kuralları

- Ders ücreti hoca başına **tek bir değerdir** ve tüm öğrenciler için
  geçerlidir (**Ayarlar** sayfası). Ücret girilmeden yoklama alınamaz.
- Yoklamada **"Geldi"** işaretlenen her öğrencinin borcuna o dersin ücreti
  yazılır; "Gelmedi" borç oluşturmaz.
- Ücret, yoklama **ilk kaydedildiğinde** kopyalanır ve bir daha değişmez.
  Ayarlar'dan ücreti değiştirmek yalnızca bundan sonraki yoklamaları etkiler.
  "Gelmedi" sonradan "Geldi"ye çevrilirse ilk kayıttaki ücret kullanılır.
- **Borç = gelinen derslerin ücreti − yapılan ödemeler.** Negatif bakiye,
  öğrencinin fazla ödeme yaptığını (alacaklı olduğunu) gösterir.
- Yoklaması veya ödemesi olan öğrenci, dersi olan grup ve yoklaması olan
  ders **kalıcı olarak silinemez** (veritabanında da zorunludur); bunlar
  arşivlenir.

## Teknolojiler

- [Next.js 15](https://nextjs.org) (App Router) + TypeScript
- [Supabase](https://supabase.com) (Postgres + Auth + Row Level Security)
- Tailwind CSS v4 + shadcn/ui (Base UI)
- react-hook-form + zod, FullCalendar, date-fns / date-fns-tz, next-themes

## Kurulum

### 1. Gereksinimler

- Node.js 20 veya üstü
- Bir Supabase projesi (ücretsiz plan yeterlidir). Gecikmeyi azaltmak için
  kullanıcılara en yakın bölgeyi seçin (Türkiye için ör. Frankfurt).

### 2. Bağımlılıklar

```bash
npm install --legacy-peer-deps
```

(`--legacy-peer-deps`, React 19 ekosistemindeki peer dependency
uyarıları nedeniyle gereklidir.)

### 3. Veritabanı

`supabase/migrations/` klasöründeki SQL dosyalarını **numara sırasıyla**
(0001 → 0009) Supabase panelindeki **SQL Editor**'de çalıştırın. Dosyalar
tabloları, `ogrenci_bakiyeleri` görünümünü, RLS politikalarını,
tetikleyicileri ve ders üretim fonksiyonlarını oluşturur.

### 4. Supabase Auth ayarları (önemli)

- **Authentication → Sign In / Providers → Email → "Allow new users to sign
  up" kapatılmalıdır.** Uygulamada kayıt sayfası yoktur; hesaplar yalnızca
  yönetici tarafından açılır. Açık bırakılırsa Supabase'in genel kayıt
  ucu üzerinden dışarıdan hesap açılabilir.
- Kullanıcı adları arka planda `kullaniciadi@ozelders.local` biçiminde
  sahte bir e-postaya çevrilir; bu adres hiçbir yerde gösterilmez ve e-posta
  gönderilmez.
- Oturum doğrulaması JWT'yi sunucuda yerel olarak doğrular (`getClaims`).
  Bunun hızlı çalışması için projenin **asimetrik JWT imza anahtarları**
  kullanması önerilir (Project Settings → JWT Keys; yeni projelerde
  varsayılandır). Eski (HS256) anahtarlarla da çalışır, yalnızca her istekte
  Auth sunucusuna gidildiği için daha yavaştır.

### 5. Ortam değişkenleri

`.env.example` dosyasını `.env.local` olarak kopyalayın ve Supabase
panelindeki **Project Settings → API** sayfasından doldurun:

| Değişken | Açıklama |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Proje URL'si |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon (public) anahtar |
| `SUPABASE_SERVICE_ROLE_KEY` | **Gizli.** Yalnızca sunucuda kullanılır (yönetim paneli, scriptler). Asla paylaşmayın ve repoya eklemeyin. |

### 6. İlk yöneticiyi oluşturma

```bash
npm run ilk-yonetici -- --kullanici admin --sifre guvenliSifre123 --ad "Sistem Yöneticisi"
```

Kullanıcı adı yalnızca küçük harf (Türkçe karakter olmadan), rakam, `.` ve
`_` içerebilir; şifre en az 8 karakter olmalıdır. Diğer hesapları
yönetici, uygulamadaki **Yönetim** sayfasından açar.

### 7. Çalıştırma

```bash
npm run dev      # geliştirme sunucusu: http://localhost:3000
```

> Geliştirme modu her sayfayı ilk açılışta derlediği ve ek denetimler
> yaptığı için belirgin şekilde yavaştır. Gerçek hızı görmek için
> production derlemesini kullanın:
>
> ```bash
> npm run build && npm start
> ```

## İlk kullanım

1. Yönetici olarak giriş yapın ve **Yönetim** sayfasından hocalar için hesap
   açın (yönetici de uygulamayı hoca olarak kullanabilir).
2. **Ayarlar**'dan ders başı ücreti girin.
3. **Gruplar**'dan grupları, **Öğrenciler**'den öğrencileri ekleyin.
4. Grup sayfasındaki **Haftalık program** ile tekrarlayan dersleri tanımlayın
   veya **Takvim**'den tek seferlik ders ekleyin.
5. Ders günü **Bugün** sayfasından yoklama alın; ödemeleri **Ödemeler** veya
   **Borçlar** sayfasından girin.

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu (Turbopack) |
| `npm run build` / `npm start` | Production derlemesi / sunucusu |
| `npm run lint` | ESLint |
| `npm run ilk-yonetici -- ...` | İlk yönetici hesabını oluşturur |
| `npm run kontrol-testi` | Veritabanı kontrol testi (aşağıya bakın) |

### Kontrol testi

```bash
npm run kontrol-testi
```

Gerçek Supabase projesinde geçici hesaplar (`kontrol_*`) açarak şunları
doğrular, ardından (hata olsa bile) hepsini siler; mevcut verilere dokunmaz:

- Bir hocanın diğer hocanın hiçbir verisini göremediği/değiştiremediği (RLS),
- Oturumsuz isteklerin veri okuyamadığı,
- Yöneticinin her şeyi görüp hiçbir şeyi değiştiremediği, kimsenin kendi
  rolünü yükseltemediği,
- Ücret kuralları (kopyalama, değişmezlik, gelmedi→geldi, fazla ödeme),
- Silme korumaları.

Şema değişikliğinden sonra çalıştırılması önerilir.

## Dağıtım (Vercel)

1. Repoyu [Vercel](https://vercel.com)'e içe aktarın (framework otomatik
   algılanır).
2. Install Command: `npm install --legacy-peer-deps`
3. **Environment Variables** bölümüne yukarıdaki üç değişkeni girin.
4. Vercel fonksiyon bölgesini Supabase projesine yakın seçin
   (Project Settings → Functions → Region; ör. Frankfurt `fra1`). Sunucu ile
   veritabanı arasındaki her gidiş-dönüş sayfa hızını doğrudan etkiler.
5. Supabase → Authentication → URL Configuration → **Site URL** alanına
   yayındaki adresi yazın.

## Proje yapısı

```
src/
  app/
    giris/             Giriş sayfası
    cikis/             Oturum kapatma (route handler)
    (uygulama)/        Oturum gerektiren sayfalar + ortak yerleşim
  actions/             Server action'lar (her biri girdiyi zod ile doğrular)
  components/          Arayüz bileşenleri (ui/ = shadcn)
  lib/
    auth/              Oturum ve yönetici yardımcıları
    supabase/          Supabase istemcileri (server, client, admin, middleware)
    validasyon/        zod şemaları
    zaman/             Europe/Istanbul tarih/saat yardımcıları
  middleware.ts        Giriş yönlendirmesi ve oturum yenileme
supabase/migrations/   Veritabanı şeması (sırayla uygulanır)
scripts/               ilk-yonetici ve kontrol-testi
```

Geliştirme notları, alınan kararlar ve bilinen tuzaklar için
[`CLAUDE.md`](./CLAUDE.md) dosyasına bakın.
