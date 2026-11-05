#!/usr/bin/env node
/**
 * ops/collect/collect.mjs
 * Mengumpulkan & memeriksa sumber feed produk dari data/incoming/ yang diizinkan (Sesuai Bagian 6 & 7 ars.md).
 * Memastikan tidak ada metode scraping ilegal dan sumber tercatat jelas.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const INCOMING_FILE = path.join(ROOT, 'data/incoming/sample_raw_products.json');

const ALLOWED_SOURCES = new Set([
  'shopee_affiliate_feed',
  'tokopedia_affiliate_feed',
  'manual_import',
  'official_partner_csv'
]);

function main() {
  console.log('=== [OPS: COLLECT] Memeriksa sumber data katalog di data/incoming ===');
  if (!fs.existsSync(INCOMING_FILE)) {
    console.error(`File tidak ditemukan: ${INCOMING_FILE}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INCOMING_FILE, 'utf8'));
  let allowedCount = 0;
  let blockedCount = 0;

  for (const item of raw) {
    if (ALLOWED_SOURCES.has(item.source)) {
      allowedCount++;
    } else {
      blockedCount++;
      console.warn(`[WARN] Sumber tidak diizinkan untuk ID ${item.id}: ${item.source}`);
    }
  }

  console.log(`Total item masuk       : ${raw.length}`);
  console.log(`Sumber patuh aturan    : ${allowedCount}`);
  console.log(`Sumber ditolak         : ${blockedCount}`);
  console.log('Langkah berikutnya: jalankan `npm run ops:validate` untuk normalisasi & validasi katalog.');
}

main();

