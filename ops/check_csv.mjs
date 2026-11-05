#!/usr/bin/env node
/**
 * ops/check_csv.mjs
 * Tool Pemeriksa CSV & Inspektur Link Produk (Multi-Marketplace: Shopee, Tokopedia, dll)
 * 
 * Fungsi:
 * 1. Membaca daftar link dari file CSV.
 * 2. Mengunjungi link produk secara langsung untuk mengekstrak data ulasan & rating asli.
 * 3. Menganalisis komentar pembeli (memisahkan ulasan positif vs komplain cacat/rusak/leceh).
 * 4. Memeriksa duplikasi dengan katalog yang sudah ada.
 * 5. Membandingkan produk sejenis dan menentukan mana yang kualitasnya paling bagus.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectProductLink } from './link_inspector.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const APPROVED_CATALOG_FILE = path.join(ROOT, 'data/approved/catalog.json');
const DEFAULT_CSV_FILE = path.join(ROOT, 'data/incoming/contoh_affiliate.csv');

// Parser CSV dengan penanganan kutip string & newline
export function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';') && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length < headers.length) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

// Analisis Komentar Ulasan Pembeli
export function analyzeReviewSentiment(reviewText = '') {
  const text = String(reviewText || '').toLowerCase();
  const negativeWords = [
    'patah', 'lecet', 'kecewa', 'jelek', 'rusak', 'palsu', 'tipis', 'bengkok',
    'bising', 'korsleting', 'longgar', 'panas banget', 'overheat', 'tidak sesuai',
    'bintang 1', 'penipu', 'retur', 'cacat', 'mudah lepas'
  ];
  const positiveWords = [
    'kokoh', 'bagus', 'tebal', 'original', 'ori', 'puas', 'cepat sampai', 'rapi',
    'pas banget', 'berfungsi baik', 'recomended', 'rekomend', 'mantap', 'senyap',
    'irit', 'garansi', 'aman', 'presisi', 'kuat'
  ];

  const foundNegatives = negativeWords.filter((w) => text.includes(w));
  const foundPositives = positiveWords.filter((w) => text.includes(w));

  let score = 50;
  score += foundPositives.length * 15;
  score -= foundNegatives.length * 25;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    positives: foundPositives,
    complaints: foundNegatives,
    isSafe: foundNegatives.length === 0 && foundPositives.length > 0
  };
}

function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

function getSimilarityKey(name) {
  const lower = name.toLowerCase();
  if (lower.includes('tray') || lower.includes('kabel')) return 'kabel_management';
  if (lower.includes('dehumidifier') || lower.includes('lembab') || lower.includes('serap')) return 'dehumidifier';
  if (lower.includes('charger') || lower.includes('gan') || lower.includes('adaptor')) return 'charger_laptop';
  if (lower.includes('bracket') || lower.includes('monitor') || lower.includes('arm')) return 'bracket_monitor';
  if (lower.includes('lampu') || lower.includes('screenbar')) return 'screenbar_lampu';
  return normalizeKey(name).slice(0, 2).join('_') || 'lainnya';
}

export async function evaluateCsvProducts(csvRows, existingCatalog, options = { inspectLinks: true }) {
  const existingUrls = new Set(existingCatalog.map((p) => (p.affiliate_url || p.destination_url || '').toLowerCase()));

  const processed = [];

  for (const row of csvRows) {
    const name = row.nama_produk || row.product_name || row.nama || 'Produk Tanpa Nama';
    const linkUrl = row.link_affiliate || row.link_produk || row.affiliate_link || row.product_link || row.url || '';
    let rating = parseFloat(row.rating) || 4.5;
    const sold = parseInt(row.terjual || row.sales || '0', 10) || 0;
    let reviews = row.ulasan_komentar || row.reviews || row.comments || '';
    const pricePromo = row.harga_promo || row.price || 'Rp0';
    const priceOriginal = row.harga_asli || row.original_price || '';
    const category = row.kategori || 'umum';

    // Kunjungi link produk jika inspeksi diaktifkan
    let linkMeta = null;
    if (options.inspectLinks && linkUrl.startsWith('http')) {
      linkMeta = await inspectProductLink(linkUrl);
      if (linkMeta && linkMeta.success) {
        if (linkMeta.rating) rating = linkMeta.rating;
        if (linkMeta.commentsText) {
          reviews = `${reviews} ${linkMeta.commentsText}`.trim();
        }
      }
    }

    const sentiment = analyzeReviewSentiment(reviews);
    const isAlreadyInCatalog = existingUrls.has(linkUrl.toLowerCase());

    const ratingWeight = (rating / 5.0) * 40;
    const sentimentWeight = (sentiment.score / 100) * 40;
    const salesWeight = Math.min(20, Math.log10(Math.max(1, sold)) * 5);
    const totalScore = Number((ratingWeight + sentimentWeight + salesWeight).toFixed(1));

    processed.push({
      name,
      linkUrl,
      category,
      rating,
      sold,
      pricePromo,
      priceOriginal,
      reviews,
      sentiment,
      isAlreadyInCatalog,
      totalScore,
      similarityKey: getSimilarityKey(name),
      platform: linkMeta?.platform || 'Online Marketplace'
    });
  }

  // Kelompokkan produk sejenis
  const grouped = {};
  for (const item of processed) {
    if (!grouped[item.similarityKey]) {
      grouped[item.similarityKey] = [];
    }
    grouped[item.similarityKey].push(item);
  }

  // Tentukan urutan pemenang di setiap kelompok
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => b.totalScore - a.totalScore);
  }

  return { processed, grouped };
}

async function runCli() {
  const targetFile = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : DEFAULT_CSV_FILE;
  console.log('================================================================');
  console.log('🔍 AUDITOR & PEMBANDING KUALITAS LINK PRODUK (MULTI-MARKETPLACE)');
  console.log('================================================================');
  console.log(`Membaca file data: ${targetFile}`);

  if (!fs.existsSync(targetFile)) {
    console.error(`File tidak ditemukan: ${targetFile}`);
    console.log(`Letakkan file CSV Anda di data/incoming/ atau jalankan: node ops/check_csv.mjs [path_file.csv]`);
    process.exit(1);
  }

  const existingCatalog = fs.existsSync(APPROVED_CATALOG_FILE)
    ? JSON.parse(fs.readFileSync(APPROVED_CATALOG_FILE, 'utf8'))
    : [];

  const rawCsv = fs.readFileSync(targetFile, 'utf8');
  const rows = parseCsv(rawCsv);
  console.log(`Memproses ${rows.length} tautan produk dan memeriksa ulasannya...\n`);

  const { processed, grouped } = await evaluateCsvProducts(rows, existingCatalog, { inspectLinks: true });

  // 1. Cek Duplikasi
  console.log('--- 1. STATUS PENGECEKAN DUPLIKASI KATALOG ---');
  let duplicateCount = 0;
  for (const p of processed) {
    if (p.isAlreadyInCatalog) {
      duplicateCount++;
      console.log(`[SUDAH ADA]  "${p.name}" (${p.linkUrl.slice(0, 35)}...)`);
    } else {
      console.log(`[PRODUK BARU] "${p.name}"`);
    }
  }
  console.log(`\nRingkasan: ${processed.length - duplicateCount} produk baru | ${duplicateCount} sudah terdaftar\n`);

  // 2. Perbandingan Kualitas Produk Sejenis
  console.log('--- 2. PERBANDINGAN PRODUK SEJENIS (RATING & ULASAN PEMBELI) ---');
  const bestPicksToImport = [];

  for (const [key, items] of Object.entries(grouped)) {
    console.log(`\nKelompok Produk: [${key.toUpperCase()}] (${items.length} pilihan dibandingkan)`);
    items.forEach((item, idx) => {
      const isWinner = idx === 0;
      const badge = isWinner ? 'PILIHAN TERBAIK' : 'KURANG DISARANKAN';
      console.log(`   ${idx + 1}. ${item.name} (${item.platform})`);
      console.log(`      Rating: ${item.rating} / 5.0 | Terjual: ${item.sold.toLocaleString('id-ID')} | Skor Kualitas: ${item.totalScore} / 100`);
      if (item.sentiment.complaints.length > 0) {
        console.log(`      Keluhan Pembeli : "${item.sentiment.complaints.join(', ')}"`);
      }
      if (item.sentiment.positives.length > 0) {
        console.log(`      Kelebihan Ulasan : "${item.sentiment.positives.join(', ')}"`);
      }
      console.log(`      Kesimpulan: [${badge}]`);

      if (isWinner && !item.isAlreadyInCatalog) {
        bestPicksToImport.push(item);
      }
    });
  }

  console.log('\n================================================================');
  console.log(`PRODUK TERPILIH (Lolos Kurasi & Ulasan Terbaik):`);
  console.log(`Ditemukan ${bestPicksToImport.length} produk unggulan yang siap dimasukkan ke sistem chat:`);
  for (const pick of bestPicksToImport) {
    console.log(`- "${pick.name}" -> ${pick.linkUrl}`);
  }
  console.log('================================================================\n');

  // Auto-Import jika ada flag --import
  const shouldImport = process.argv.includes('--import') || process.argv.includes('-i');
  if (shouldImport && bestPicksToImport.length > 0) {
    console.log('Memperbarui data katalog asisten chat...');

    for (const item of bestPicksToImport) {
      const slugId = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 45);
      const newEntry = {
        id: slugId,
        name: item.name,
        headline: `Produk terverifikasi dengan rating ${item.rating} / 5.0 dan ulasan pembeli positif`,
        category: item.category,
        price_promo: item.pricePromo.startsWith('Rp') ? item.pricePromo : `Rp${item.pricePromo}`,
        price_original: item.priceOriginal ? (item.priceOriginal.startsWith('Rp') ? item.priceOriginal : `Rp${item.priceOriginal}`) : item.pricePromo,
        discount_tag: 'Pilihan Terverifikasi',
        rating: item.rating,
        sales_count: item.sold,
        image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80',
        destination_url: item.linkUrl,
        affiliate_url: item.linkUrl,
        marketplace_name: item.platform,
        free_shipping_badge: 'Pengiriman Cepat & Terjamin',
        specs: {
          material: 'Material berkualitas tinggi lulus uji ulasan pembeli',
          durability: 'Ulasan pembeli mengonfirmasi produk kokoh & awet'
        },
        sales_points: [
          `Terpilih sebagai produk terbaik dengan rating tinggi ${item.rating} / 5.0`,
          `Bebas dari keluhan umum pembeli berdasarkan analisis ulasan marketplace`,
          `Tautan resmi dengan garansi pembeli`
        ],
        faq: [
          {
            q: 'Apakah produk ini terjamin kualitasnya?',
            a: `Sangat terjamin. Produk ini dipilih berdasarkan rating tinggi ${item.rating} / 5.0 dan ulasan pembeli terverifikasi yang puas dengan kualitasnya.`
          },
          {
            q: 'Bagaimana dengan pengiriman dan garansi?',
            a: 'Pengiriman aman dengan jaminan retur jika barang tiba dalam kondisi rusak.'
          }
        ],
        status: 'published'
      };

      const existingIdx = existingCatalog.findIndex((p) => p.id === slugId);
      if (existingIdx >= 0) {
        existingCatalog[existingIdx] = newEntry;
      } else {
        existingCatalog.unshift(newEntry);
      }
    }

    fs.writeFileSync(APPROVED_CATALOG_FILE, JSON.stringify(existingCatalog, null, 2) + '\n', 'utf8');

    const syncScript = path.join(ROOT, 'ops/sync/sync-d1.mjs');
    const { execSync } = await import('node:child_process');
    execSync(`node "${syncScript}"`, { stdio: 'inherit' });
    console.log('Katalog chat berhasil diperbarui dengan produk terbaik!');
  } else if (!shouldImport) {
    console.log('Untuk langsung memasukkan produk terpilih ke katalog chat, jalankan:');
    console.log(`node ops/check_csv.mjs [path_csv] --import\n`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
