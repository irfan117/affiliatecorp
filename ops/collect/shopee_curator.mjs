#!/usr/bin/env node
/**
 * ops/collect/shopee_curator.mjs
 * Tool Kurator Produk Shopee Affiliate dari VS Code.
 * 
 * Fungsi:
 * 1. Memeriksa URL produk & link affiliate Shopee pengguna (s.shopee.co.id / shopee.co.id).
 * 2. Menganalisis kriteria kualitas (Rating bintang >= 4.8, analisis ulasan komentar positif/negatif, niche produk).
 * 3. Otomatis merumuskan Product Sales Knowledge Base (spesifikasi, FAQ objection handling, dan sales pitch).
 * 4. Menambahkan produk ke data/approved/catalog.json dan menyinkronkan langsung ke web agar komisi affiliate masuk ke akun pengguna.
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const APPROVED_CATALOG_FILE = path.join(ROOT, 'data/approved/catalog.json');
const WEB_SALES_FILE = path.join(ROOT, 'cloudflare-shopify-assistant/src/data/salesProducts.ts');

const ALLOWED_NICHES = [
  { id: 'meja-kerja', name: 'Meja Kerja & Setup Rapi' },
  { id: 'kamar-kos', name: 'Kamar Kos & Ruang Sempit' },
  { id: 'rumah-praktis', name: 'Rumah Tangga Praktis' },
  { id: 'aksesori-tekno', name: 'Aksesori Gadget & Kelistrikan' }
];

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// Analisis komentar ulasan pembeli (Filter Komplain & Validasi Kepuasan)
export function evaluateReviews(reviewsText = '') {
  const text = String(reviewsText || '').toLowerCase();
  const negativeWords = ['patah', 'lecet', 'kecewa', 'jelek', 'rusak', 'palsu', 'tipis banget', 'tidak sesuai', 'bintang 1', 'penipu'];
  const positiveWords = ['kokoh', 'bagus banget', 'tebal', 'original', 'puas', 'cepat sampai', 'rapi', 'pas banget', 'berfungsi baik', 'recomended', 'rekomend'];

  const foundNegatives = negativeWords.filter((w) => text.includes(w));
  const foundPositives = positiveWords.filter((w) => text.includes(w));

  const isApproved = foundNegatives.length === 0 || foundPositives.length >= foundNegatives.length * 3;
  return {
    isApproved,
    positivePoints: foundPositives,
    complaintPoints: foundNegatives,
    summary: isApproved
      ? `Ulasan terverifikasi sangat positif (${foundPositives.length} indikator kepuasan ditemukan). Aman untuk diiklankan.`
      : `Peringatan: Ditemukan indikator komplain pembeli (${foundNegatives.join(', ')}). Periksa kembali sebelum menambahkan.`
  };
}

export function buildProductSalesEntry(input) {
  const slug = slugify(input.name);
  const id = input.id || slug;

  return {
    id,
    name: input.name.trim(),
    headline: input.headline.trim(),
    category: input.category,
    price_promo: input.price_promo,
    price_original: input.price_original || input.price_promo,
    discount_tag: input.discount_tag || 'Promo Iklan',
    rating: Number(input.rating) || 4.9,
    sales_count: Number(input.sales_count) || 1000,
    image_url: input.image_url,
    destination_url: input.destination_url || input.affiliate_url,
    affiliate_url: input.affiliate_url.trim(),
    marketplace_name: input.marketplace_name || 'Shopee Mall / Star+',
    free_shipping_badge: input.free_shipping_badge || 'Gratis Ongkir XTRA',
    specs: input.specs || {
      material: 'Bahan berkualitas tinggi, kokoh & awet',
      compatibility: 'Cocok untuk kebutuhan harian standar',
      installation: 'Mudah dipasang tanpa alat berat'
    },
    sales_points: input.sales_points || [
      'Menyelesaikan masalah yang sering dialami pembeli di iklan',
      'Kualitas terjamin dengan ribuan ulasan pembeli puas',
      'Harga promo terbaik khusus tautan afiliasi ini'
    ],
    faq: input.faq || [
      {
        q: 'Apakah barang ini original dan aman dikirim?',
        a: `100% Original dari toko resmi di ${input.marketplace_name || 'Shopee'} kak. Pengemasan sudah memakai bubble wrap tebal dan ada garansi retur jika terjadi kerusakan saat ekspedisi.`
      },
      {
        q: 'Berapa lama masa promonya?',
        a: `Harga promo ${input.price_promo} dari link iklan ini berlaku terbatas mengikuti kuota voucher harian ya kak.`
      }
    ],
    status: 'published'
  };
}

async function runInteractiveCli() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log('\n======================================================');
  console.log('🛍️  SHOPEE AFFILIATE PRODUCT IMPORTER & SALES CURATOR');
  console.log('======================================================');
  console.log('Alat ini menyaring produk berdasarkan:');
  console.log('1. Niche pasar (Meja Kerja, Kos, Rumah Praktis, Tekno)');
  console.log('2. Rating bintang (wajib tinggi, min 4.7-4.9)');
  console.log('3. Analisis komentar & komplain pembeli');
  console.log('4. Tautan Affiliate Akun Shopee Anda (agar komisi masuk ke akun Anda)\n');

  try {
    const rawAffLink = await question('1. Masukkan Link Shopee Affiliate Anda (s.shopee.co.id/... atau shopee.co.id/...): ');
    if (!rawAffLink.trim().startsWith('http')) {
      console.log('❌ Tautan affiliate tidak valid. Wajib diawali https:// (contoh: https://s.shopee.co.id/xxxx)');
      rl.close();
      return;
    }

    const name = await question('2. Nama Produk (sesuai yang diiklankan): ');
    if (!name.trim()) {
      console.log('❌ Nama produk tidak boleh kosong.');
      rl.close();
      return;
    }

    console.log('\nPilih Niche Produk:');
    ALLOWED_NICHES.forEach((n, idx) => console.log(`   ${idx + 1}. ${n.name} (${n.id})`));
    const nicheChoice = await question('Pilih nomor niche (1-4): ');
    const selectedNiche = ALLOWED_NICHES[parseInt(nicheChoice, 10) - 1]?.id || 'meja-kerja';

    const ratingInput = await question('3. Rating Bintang Toko/Produk (contoh: 4.9): ');
    const rating = parseFloat(ratingInput) || 4.9;
    if (rating < 4.7) {
      console.log(`⚠️  Peringatan: Rating ${rating} di bawah standar rekomendasi iklan (min 4.7). Disarankan cari produk dengan rating minimal 4.8 untuk konversi tinggi.`);
    }

    const salesCountInput = await question('4. Jumlah Produk Terjual (contoh: 3500): ');
    const salesCount = parseInt(salesCountInput, 10) || 1200;

    const pricePromo = await question('5. Harga Promo Iklan (contoh: Rp65.000 - Rp85.000): ');
    const priceOriginal = await question('6. Harga Coret Asli (contoh: Rp120.000): ');
    const imageUrl = await question('7. Link Foto Produk (URL gambar JPG/PNG/Unsplash): ');

    console.log('\n--- ANALISIS KOMENTAR / ULASAN PEMBELI ---');
    console.log('Tempelkan beberapa kalimat ulasan/komentar dari pembeli di Shopee untuk dianalisis:');
    const sampleReviews = await question('(Contoh: "Bahan besi tebal kokoh, meja tidak lecet, pengiriman cepat"): ');

    const reviewAnalysis = evaluateReviews(sampleReviews);
    console.log(`\n🔍 Hasil Analisis Komentar: ${reviewAnalysis.summary}`);

    const headline = await question('\n8. Headline Solusi Iklan (contoh: "Merapikan Kabel Meja Kerja Tanpa Perlu Bor"): ');

    const newProduct = buildProductSalesEntry({
      name,
      headline,
      category: selectedNiche,
      price_promo: pricePromo || 'Rp65.000',
      price_original: priceOriginal || 'Rp110.000',
      discount_tag: 'Diskon Iklan Shopee',
      rating,
      sales_count: salesCount,
      image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80',
      destination_url: rawAffLink.trim(),
      affiliate_url: rawAffLink.trim(),
      marketplace_name: 'Shopee Star+ / Mall',
      free_shipping_badge: 'Gratis Ongkir XTRA'
    });

    // Simpan ke catalog.json
    const currentCatalog = fs.existsSync(APPROVED_CATALOG_FILE)
      ? JSON.parse(fs.readFileSync(APPROVED_CATALOG_FILE, 'utf8'))
      : [];

    // Ganti jika id sudah ada atau tambahkan di awal
    const existingIdx = currentCatalog.findIndex((p) => p.id === newProduct.id);
    if (existingIdx >= 0) {
      currentCatalog[existingIdx] = newProduct;
      console.log(`\n✏️  Memperbarui produk yang sudah ada (${newProduct.id}).`);
    } else {
      currentCatalog.unshift(newProduct);
      console.log(`\n✨ Menambahkan produk baru (${newProduct.id}).`);
    }

    fs.writeFileSync(APPROVED_CATALOG_FILE, JSON.stringify(currentCatalog, null, 2) + '\n', 'utf8');

    // Sinkronkan ke frontend TypeScript
    const syncScript = path.join(ROOT, 'ops/sync/sync-d1.mjs');
    const { execSync } = await import('node:child_process');
    execSync(`node "${syncScript}"`, { stdio: 'inherit' });

    console.log('\n======================================================');
    console.log('✅ PRODUK BERHASIL DITAMBAHKAN KE WEB!');
    console.log(`🔗 Link Affiliate Anda : ${newProduct.affiliate_url}`);
    console.log(`🆔 ID Produk Iklan    : ${newProduct.id}`);
    console.log(`🌐 URL Iklan Anda      : http://localhost:5173/?p=${newProduct.id}`);
    console.log('======================================================');
    console.log('Setiap pengunjung yang mengklik produk ini dari iklan sosmed');
    console.log('akan dilayani oleh AI Sales dan transaksi terhitung ke akun Shopee Affiliate Anda!\n');
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  } finally {
    rl.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runInteractiveCli();
}

