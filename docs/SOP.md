# SOP Operasional dari VS Code (Tanpa Panel Admin Web)

Sesuai Bagian 7 & 11 `ars.md`, seluruh operasional bisnis dijalankan dari terminal/task VS Code.

## 1. Rutinitas Harian (20–40 Menit)

1. **Lihat Laporan Kemarin (`report`):**
   ```bash
   npm run ops:report
   ```
   Tinjau file `docs/latest-report.md` untuk melihat topik masalah tertinggi, CTR kartu produk, dan produk kedaluwarsa.
2. **Periksa Produk Ditolak & Link Mati:**
   Buka `data/rejected/rejected_items.json` untuk melihat produk yang gagal lolos guardrail.
3. **Koreksi / Tambah Produk:**
   Tambahkan item baru ke `data/incoming/sample_raw_products.json` dari feed resmi affiliate.
4. **Validasi, Sinkronisasi, & Uji Unit:**
   ```bash
   npm run ops:pipeline
   npm test
   ```

## 2. Rutinitas Mingguan

1. Pilih 10–30 query dengan demand tinggi dari bagian **Top Masalah yang Dicari Pengguna** di `docs/latest-report.md`.
2. Cari produk dengan rating >= 4.7 dan ulasan terverifikasi melalui program affiliate resmi.
3. Jalankan `npm run ops:validate` dan pastikan setiap produk memiliki `tradeoffs` (catatan risiko jujur).
4. Buat 2–5 konten pendek (TikTok/Reels/SEO) yang berangkat dari masalah nyata pengguna.

## 3. Rutinitas Bulanan

1. Hapus produk yang `source_updated_at`-nya lebih dari 30 hari atau stok habis permanen.
2. Audit secret Cloudflare Worker (`wrangler secret list`) — pastikan tidak ada API key di Git.
3. Hitung ulang Unit Economics di `docs/latest-report.md` dengan angka komisi aktual.

