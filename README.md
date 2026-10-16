# Özel Ders Takip Sistemi

Özel ders hocaları için yoklama, takvim ve borç takip uygulaması.

> **Durum:** Kurulum aşaması tamamlandı. Kapsamlı kurulum, Supabase
> yapılandırması ve dağıtım talimatları içeren tam README, Aşama 10'da
> (Son Kontrol) buraya eklenecektir.

## Yerel geliştirme

```bash
npm install
npm run dev
```

Ortam değişkenleri için `.env.example` dosyasını `.env.local` olarak
kopyalayıp Supabase proje bilgilerinizi girin.

## Kimlik doğrulama kurulumu (önemli)

- **Kayıt ol sayfası yok.** Kullanıcılar yalnızca `ilk-yonetici` scripti
  veya Yönetim panelinden eklenir. Supabase panelinde
  **Authentication → Sign In / Providers → Email → "Allow new users to
  sign up"** seçeneği **kapatılmalıdır**; aksi halde Supabase'in genel
  signup endpoint'i üzerinden dışarıdan kayıt açılabilir.
- Kullanıcı adları arka planda `kullaniciadi@ozelders.local` sahte
  e-postasına çevrilir; bu e-posta hiçbir yerde kullanıcıya gösterilmez.

### İlk yöneticiyi oluşturma

```bash
npm run ilk-yonetici -- --kullanici <kullanici_adi> --sifre <en_az_8_karakter> --ad "<Ad Soyad>"
```

Örnek:

```bash
npm run ilk-yonetici -- --kullanici admin --sifre guvenliSifre123 --ad "Sistem Yöneticisi"
```

Script, `.env.local` içindeki `SUPABASE_SERVICE_ROLE_KEY` ile çalışır ve
`/giris` sayfasından bu kullanıcı adı/şifre ile giriş yapılabilir hale
getirir.

## Teknolojiler

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres + Auth + RLS)
- react-hook-form + zod
- FullCalendar (Türkçe yerelleştirme)
- date-fns + date-fns-tz (Europe/Istanbul)
