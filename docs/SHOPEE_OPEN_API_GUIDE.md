# Panduan Integrasi Shopee Affiliate Open API

Dokumentasi Resmi: [https://affiliate.shopee.co.id/open_api/home](https://affiliate.shopee.co.id/open_api/home)

---

## 1. Mengapa Shopee Affiliate Open API Sangat Berguna?

Shopee Affiliate Open API adalah **jalur resmi (official API)** dari Shopee yang menyediakan fitur otomatisasi:

### A. Otomatis Generate Link Affiliate (`generateShortLink`)
- **Masalah sebelumnya:** Anda harus membuka aplikasi Shopee di HP, mencari produk, klik *Bagi*, salin link affiliate, lalu paste manual.
- **Dengan Open API:** Anda cukup menempel link produk Shopee biasa mana pun (misal `https://shopee.co.id/product/123/456`), dan API akan **otomatis mengubahnya menjadi link affiliate resmi akun Anda** (`https://s.shopee.co.id/xxxx`).

### B. Pencarian Produk Rekomendasi Komisi Tertinggi (`productOfferV2`)
- Mencari produk terlaris di niche Anda (misal "tray kabel", "charger 65w").
- Mengurutkan produk berdasarkan:
  - **Tingkat Komisi Tertinggi** (*commission rate*, misal 8% - 15%).
  - **Rating Bintang Terbaik** (⭐ 4.8 - 5.0).
  - **Volume Penjualan Tertinggi** (*sales volume*).
- Menarik foto produk HD asli, harga promo, dan rincian estimasi rupiah komisi per penjualan secara instan.

---

## 2. Cara Mendapatkan Kredensial Shopee Open API

1. Buka [https://affiliate.shopee.co.id/open_api/home](https://affiliate.shopee.co.id/open_api/home).
2. Login dengan akun Shopee Affiliate Anda.
3. Ajukan permohonan akses / buat API App.
4. Salin 2 kunci rahasia Anda:
   - **App ID** (misal: `12345678`)
   - **Secret** (misal: `abcdef1234567890xxxx`)

---

## 3. Modul yang Sudah Disediakan di Project Ini

Kami telah membuatkan modul klien GraphQL resmi di:
📁 [`ops/shopee_api.mjs`](file:///home/enki/react_terdokumentasi/afiliatcorp/ops/shopee_api.mjs)

Modul ini sudah mengimplementasikan:
- Otentikasi signature SHA256 resmi (`SHA256 Credential=..., Timestamp=..., Signature=...`).
- Fungsi `generateShortLink(originUrl)` untuk membuat link affiliate otomatis.
- Fungsi `searchProductOffers(keyword)` untuk query produk komisi tinggi.

Anda bisa mengatur kredensial di file environment lokal `.env`:
```env
SHOPEE_APP_ID=id_anda_dari_shopee
SHOPEE_APP_SECRET=secret_anda_dari_shopee
```
Atau tetap menggunakan mode cepat (salin link affiliate dari tombol *Bagi* di aplikasi Shopee) langsung lewat tombol **`Tool Affiliate`** di web!

