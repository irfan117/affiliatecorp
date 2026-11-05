# Laporan Operasional & KPI — AI Shopping Assistant Affiliate

**Waktu Generate:** 2026-11-05T02:39:26.736Z
**Sumber Kontrol:** VS Code CLI (`ops/reports/report.mjs`)

## 1. Funnel & KPI Utama (Bagian 12 `ars.md`)

| Metrik KPI | Nilai Saat Ini | Catatan |
|---|---|---|
| Estimasi Pengunjung | 420 | Periode sampel lokal |
| Pertanyaan Masuk (Chat Dimulai) | 10 | **Chat Start Rate:** 2.4% |
| Rekomendasi Tampil | 10 | **Recommendation Success Rate:** 100.0% |
| Total Affiliate Click | 9 | **CTR Kartu Produk:** 90.0% |
| Cost per Chat AI | Rp 45 | Cache hit: 3/10 |
| Error Rate | 0.0% | Semua tautan tervalidasi |

## 2. Top Masalah yang Dicari Pengguna (Demand Signal)

1. **kabel berantakan & meja kerja sempit** — 3 query
2. **kamar kos lembap & bau apek** — 2 query
3. **leher pegal menatap layar laptop** — 1 query
4. **colokan di meja kurang & adaptor besar** — 1 query
5. **kamar kos sempit & susah jemur baju** — 1 query
6. **dapur sempit & kulkas berantakan** — 1 query
7. **kursi kerja untuk ruang kos sangat sempit** — 1 query

## 3. Performa Klik Produk Teratas

- `prd-mk-001` **Under-Desk Cable Management Tray Besi Kokoh Tanpa Bor (Clamp Jepit)** (meja-kerja): **3 klik**
- `prd-rp-002` **Set Kontainer Food Preparation Kulkas Kedap Udara + Peniris (Isi 6 Box)** (rumah-praktis): **1 klik**
- `prd-at-001` **Charger GaN 65W 3-Port (2 USB-C + 1 USB-A) Ringkas Satu Kepala untuk Laptop & HP** (aksesori-tekno): **1 klik**
- `prd-kk-003` **Rak Troli Susun 3 Tingkat Roda Slim (Lebar 22 cm) Celah Sempit** (kamar-kos): **1 klik**
- `prd-mk-004` **Bracket Lengan Monitor Tunggal Gas Spring Ergonomis (17-32 Inci)** (meja-kerja): **1 klik**
- `prd-mk-002` **Box Organizer Kabel & Stop Kontak Kayu Minimalis Anti Debu** (meja-kerja): **1 klik**
- `prd-kk-001` **Dehumidifier Mini Elektrik 800ml Auto-Off untuk Kamar Kos Lembap** (kamar-kos): **1 klik**

## 4. Kesehatan Katalog

- **Produk Aktif (`published`):** 26 produk
- **Produk Ditolak Validasi (`rejected`):** 2 item
- **Produk Kedaluwarsa (>14 hari belum sinkron):** 0 produk

## 5. Simulasi Unit Economics Bulanan (Rumus Bagian 12 `ars.md`)

- **Asumsi:** Conversion marketplace 4.5% × Nilai order Rp 110.000 × Komisi 6.0% = **Rp 297 / klik**
- **Proyeksi Klik Bulanan (30x sampel):** 270 klik
- **Proyeksi Pendapatan Komisi:** Rp 80.190
- **Estimasi Biaya AI + Tools Bulanan:** Rp 38.500
- **Laba Kontribusi:** **Rp 41.690**
- **Break-even Klik Bulanan:** **130 klik**
