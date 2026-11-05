# Rancangan Bisnis Final — AI Sales Produk Affiliate (Social Media Ads Traffic)

**Status dokumen:** Blueprint bisnis + produk + operasional + teknologi untuk asisten penjualan virtual (AI Sales Closer) berbasis AI berbahasa Indonesia untuk pengunjung dari iklan media sosial.

---

## 1. Ringkasan Eksekutif & Pivot Model

Produk ini adalah **AI Sales Produk (Conversational Sales Assistant)** untuk trafik yang datang dari **iklan media sosial (TikTok Ads, Instagram Reels, Facebook Ads, YouTube Shorts, atau link bio)**.

### Perbedaan Mendasar dengan Mesin Rekomendasi:
- **Bukan Mesin Rekomendasi / Pembanding Produk Sejenis:** Pengunjung **tidak datang** untuk mencari katalog ratusan produk atau membandingkan 3 merek berbeda dari awal. Pengunjung sudah melihat **SATU produk spesifik di iklan sosmed** dan mengklik link karena tertarik.
- **AI Sales Produk (Conversational Closer):** Pengunjung masuk ke halaman produk tersebut dengan rasa ingin tahu, pertanyaan teknis, keraguan ukuran/kompatibilitas, atau butuh validasi sebelum membeli.
- **Peran AI:** Bertindak sebagai **Sales Representative / Konsultan Toko** yang:
  1. Menjawab pertanyaan spesifik mengenai produk tersebut (ukuran, bahan, kecocokan, cara pasang, daya tahan, kelengkapan paket).
  2. Menangani keberatan & keraguan pembeli (*objection handling*).
  3. Bersikap jujur dan transparan mengenai batasan produk (*trade-offs*, misal ketebalan meja minimal, jenis voltase, dll) untuk membangun kepercayaan tinggi.
  4. Mendorong konversi (*sales closing*) dengan mengarahkan pembeli langsung ke tombol checkout affiliate resmi marketplace (Shopee / Tokopedia).

### Pusat Kendali dari VS Code:
Tidak ada panel admin web yang rumit. **VS Code menjadi pusat kendali bisnis**:
- Mengelola data produk yang sedang diiklankan di sosmed (`data/products/`).
- Menulis & memperbarui *Product Knowledge Base* (spesifikasi, batasan, FAQ, argumen sales).
- Memperbarui tautan affiliate resmi (`/go/:productId`).
- Menganalisis log pertanyaan pembeli untuk mengetahui apa yang paling sering membuat pembeli ragu, lalu memperbaiki copy iklan & skrip sales.

---

## 2. Alur Pengunjung & Funnel Monetisasi

```text
[ Iklan Sosmed (TikTok / Reels / IG / FB) ]
                    ↓
[ Klik Link Iklan Spesifik (?p=product-id) ]
                    ↓
[ Halaman AI Sales Produk: Foto, Nama, Harga Promo, Badge Resmi ]
                    ↓
[ Calon Pembeli Bertanya Keraguan / Kompatibilitas ke AI Sales ]
  (Contoh: "Meja saya tebal 3,5 cm bisa muat nggak?", "Colokan kaki 3 muat?")
                    ↓
[ AI Sales Menjawab Ramah, Tuntas, Jujur, & Memberikan Sales Pitch ]
                    ↓
[ CTA Closing Persuasif: "Amankan Promo di Shopee / Tokopedia" ]
                    ↓
[ Redirect Aman /go/:productId → Marketplace Resmi ]
                    ↓
[ Transaksi Selesai → Komisi Afiliasi Masuk ]
```

---

## 3. Persona AI Sales & Guardrail Komunikasi

### Persona AI:
- **Gaya Bicara:** Ramah, solutif, percaya diri, menggunakan bahasa Indonesia santun (*"Halo kak! Ya, untuk produk ini..."*).
- **Fokus Tunggal:** Membantu calon pembeli memahami dan yakin membeli produk yang sedang dilihat.
- **Handling Objection:**
  - *Keraguan ukuran/pasang:* Jelaskan batas ketebalan atau dimensi dengan jelas.
  - *Keraguan kualitas:* Sebutkan bahan (misal besi carbon steel anti karat), rating pembeli sebelumnya (4.9/5.0), dan ribuan unit terjual.
  - *Keraguan pengiriman/keaslian:* Pastikan diarahkan ke toko resmi marketplace dengan garansi pembeli.
- **Guardrail Kepatuhan:**
  - Tetap jujur mengenai batasan produk (jika memang tidak muat untuk meja tanpa bibir, katakan terus terang agar tidak ada komplain retur).
  - Tolak klaim palsu / klaim medis ilegal.
  - Tautan checkout selalu berasal dari URL affiliate resmi yang tervalidasi di database.

---

## 4. Struktur Data Knowledge Base Produk

Setiap produk yang diiklankan memiliki data lengkap untuk dibaca oleh AI Sales:
```json
{
  "id": "tray-kabel-jepit",
  "name": "Under-Desk Cable Management Tray Besi Tanpa Bor (Clamp Jepit)",
  "headline": "Solusi Meja Kerja Rapi Tanpa Bor & Tanpa Merusak Daun Meja",
  "price_promo": "Rp65.000 - Rp89.000",
  "rating": 4.9,
  "sales_count": 3400,
  "marketplace": "Shopee Mall / Star+",
  "affiliate_url": "https://s.shopee.co.id/aff-mk-001-tray-kabel",
  "specs": {
    "material": "Besi Carbon Steel tebal 1.5mm lapis powder coating anti karat",
    "compatibility": "Daun meja ketebalan 1,2 cm hingga 4,5 cm. Butuh bibir meja minimal 4 cm.",
    "installation": "Sistem klem putar manual, tanpa paku, tanpa bor, ada bantalan karet pelindung meja",
    "capacity": "Mampu menahan beban hingga 5 kg (stop kontak 6 lubang + 3 adaptor laptop)"
  },
  "sales_pitch": "Kelebihan utamanya tidak bikin meja lecet dan lantai langsung bersih dari kabel adaptor yang biasanya bikin kaki tersandung.",
  "common_objections": [
    {
      "question": "Apakah bikin meja lecet?",
      "answer": "Aman kak! Bagian klemnya sudah dilengkapi bantalan karet silicone pelindung, jadi permukaan meja kayu atau kaca kakak tidak akan lecet saat dijepit kencang."
    },
    {
      "question": "Apakah muat stop kontak besar?",
      "answer": "Muat kak, lebar tray 12 cm dan panjang 38 cm, pas untuk stop kontak 4-6 lubang beserta adaptor laptop tebal."
    }
  ]
}
```

---

## 5. Operasional Harian dari VS Code

1. **Lihat Keraguan Calon Pembeli:**
   Jalankan `npm run ops:report` untuk melihat apa saja yang ditanyakan pengunjung hari ini. Jika banyak yang tanya "bisa buat meja IKEA Linnmon?", tambahkan info tersebut ke Knowledge Base.
2. **Tambah Produk Iklan Baru:**
   Bikin kampanye iklan baru di TikTok/IG? Tambahkan produk ke katalog dengan `knowledge_base` lengkap.
3. **Optimasi Closing Rate:**
   Evaluasi kata-kata CTA dan tingkat konversi klik ke marketplace.
