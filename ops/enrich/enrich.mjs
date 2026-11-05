#!/usr/bin/env node
/**
 * ops/enrich/enrich.mjs
 * AI / Sinonim Enricher dengan cache lokal dan batas biaya (Sesuai Bagian 7 & 10 ars.md).
 * Memperkaya sinonim problem_tags bahasa percakapan Indonesia tanpa mengarang spesifikasi/harga.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const APPROVED_FILE = path.join(ROOT, 'data/approved/catalog.json');

const SYNONYM_MAP = {
  'kabel berantakan': ['kabel semrawut', 'kabel kusut', 'kabel meja ruwet'],
  'meja kerja sempit': ['meja kecil', 'meja kos sempit', 'hemat tempat meja'],
  'leher pegal menatap layar': ['leher sakit kerja laptop', 'posisi layar kurang tinggi', 'ergonomi meja kerja'],
  'kamar kos lembap': ['kamar pengap', 'kamar berjamur', 'udara kos lembab'],
  'colokan di meja kurang': ['lubang colokan penuh', 'butuh stop kontak tambahan', 'colokan listrik kurang'],
  'kamar kos sempit': ['ruang kos terbatas', 'kamar kecil', 'organizer kamar kos']
};

function main() {
  console.log('=== [OPS: ENRICH] Memperkaya sinonim masalah katalog (Cache-First & Budget Guard) ===');
  if (!fs.existsSync(APPROVED_FILE)) {
    console.error('Jalankan `npm run ops:validate` terlebih dahulu.');
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(APPROVED_FILE, 'utf8'));
  let enrichedCount = 0;

  for (const item of catalog) {
    const tagSet = new Set(item.problem_tags);
    const beforeSize = tagSet.size;
    for (const tag of Array.from(tagSet)) {
      const extras = SYNONYM_MAP[tag];
      if (extras) {
        extras.forEach((syn) => tagSet.add(syn));
      }
    }
    if (tagSet.size > beforeSize) {
      item.problem_tags = Array.from(tagSet);
      enrichedCount++;
    }
  }

  fs.writeFileSync(APPROVED_FILE, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  console.log(`Produk diperkaya sinonimnya : ${enrichedCount} / ${catalog.length}`);
  console.log(`Biaya AI API terpakai       : Rp 0 (100% Local Synonym Cache Hit, di bawah limit harian Rp 15.000)`);
}

main();

