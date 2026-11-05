# Panduan Kurasi Produk Shopee Affiliate dari VS Code

Panduan ini menjelaskan cara memilih produk dengan **Rating Bintang Tinggi**, **Analisis Komentar Positif**, dan memasukkan **Link Affiliate Akun Shopee Anda** langsung ke web ini agar komisi 100% masuk ke akun Anda.

---

## 1. Alur Kerja Aman & Resmi (Tanpa Risiko Bot Terblokir)

Shopee memiliki proteksi ketat (Akamai, puzzle captcha, dan deteksi bot). Jika kita mencoba membuat bot otomatis login dengan username & password Anda dari terminal, akun Shopee Affiliate Anda sangat berisiko terkena penalti kepatuhan atau terkena suspend.

**Metode Terbaik & Aman (User-Driven via VS Code):**
1. Buka Shopee di browser Anda (atau via VS Code Simple Browser) dan login ke akun Shopee Affiliate Anda.
2. Cari produk di niche Anda (misal: *tray kabel jepit meja*, *dehumidifier mini*, dll).
3. Salin **Link Afiliasi Anda** (dari tombol **Bagi & Dapatkan Komisi** / shortlink `https://s.shopee.co.id/...`).
4. Jalankan tool kurator di terminal VS Code:
   ```bash
   npm run ops:add-product
   ```
5. Tool akan memandu Anda:
   - Memasukkan Link Affiliate Anda (sehingga komisi tercatat ke akun Anda).
   - Memeriksa **Rating Bintang** (ambang batas min 4.7 – 4.9).
   - Menganalisis **Komentar Pembeli** (mendeteksi apakah ada komplain barang patah, cat lecet, atau apakah pembeli puas).
   - Otomatis merumuskan **Product Knowledge Base** untuk AI Sales (spesifikasi, keunggulan, FAQ).
   - Otomatis memperbarui web (`catalog.json` & `salesProducts.ts`).

---

## 2. Cara Menjalankan Tool

Cukup buka terminal di VS Code dan ketik:
```bash
npm run ops:add-product
```
atau tekan `Ctrl+Shift+P` → pilih **Tasks: Run Task** → pilih **`ops:add-product (Kurasi & Impor Produk Shopee Affiliate)`**.

Tool akan menanyakan beberapa data ringkas:
- Link Affiliate Shopee Anda (`https://s.shopee.co.id/xxxx`)
- Nama Produk & Niche
- Rating Bintang (otomatis memvalidasi kualitas)
- Potongan komentar/ulasan pembeli untuk dianalisis AI
- Harga promo & coret

Setelah selesai, produk langsung aktif di web dan AI Sales siap melayani calon pembeli dari iklan Anda!

