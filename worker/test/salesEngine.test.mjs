import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findProductById, generateSalesResponse } from '../src/salesEngine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.resolve(__dirname, '../../data/approved/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

test('1. Menemukan produk spesifik yang diklik dari iklan sosmed berdasarkan ID serta memiliki produk pelengkap (cross-sell)', () => {
  const prod = findProductById(catalog, 'tray-kabel-jepit');
  assert.ok(prod);
  assert.equal(prod.id, 'tray-kabel-jepit');
  assert.equal(prod.marketplace_name, 'Official Store');
  assert.ok(Array.isArray(prod.complementary_ids) && prod.complementary_ids.length >= 2);
});

test('2. Menjawab pertanyaan ukuran & tebal meja secara tuntas dan informatif', () => {
  const prod = findProductById(catalog, 'tray-kabel-jepit');
  const res = generateSalesResponse(prod, 'Meja saya tebal 3,5 cm apakah muat dipasang?');
  assert.equal(res.status, 200);
  assert.ok(res.body.answer.includes('tebal') || res.body.answer.includes('1,2 cm'));
  assert.ok(res.body.closing_cta.url.startsWith('https://'));
});

test('3. Menjawab pertanyaan cara pasang & membuktikan tidak perlu bor meja', () => {
  const prod = findProductById(catalog, 'tray-kabel-jepit');
  const res = generateSalesResponse(prod, 'Apakah perlu bor meja atau pakai obeng khusus?');
  assert.equal(res.status, 200);
  assert.ok(res.body.answer.includes('bor') || res.body.answer.includes('Klem'));
  assert.ok(res.body.closing_cta.price_promo.includes('Rp65.000'));
});

test('4. Menangani keraguan pembeli tentang kualitas bahan & lecet (objection handling)', () => {
  const prod = findProductById(catalog, 'tray-kabel-jepit');
  const res = generateSalesResponse(prod, 'Apakah bahannya gampang patah atau bikin daun meja saya lecet?');
  assert.equal(res.status, 200);
  assert.ok(
    res.body.answer.includes('Besi') ||
      res.body.answer.includes('silikon') ||
      res.body.answer.includes('tergores')
  );
});

test('5. Menjawab pertanyaan garansi dan keaslian produk dari iklan', () => {
  const prod = findProductById(catalog, 'gan-charger-65w');
  const res = generateSalesResponse(prod, 'Apakah ini original dan ada garansi resminya?');
  assert.equal(res.status, 200);
  assert.ok(res.body.answer.includes('Original') || res.body.answer.includes('resmi'));
  assert.equal(res.body.closing_cta.badge, 'Garansi 18 Bulan');
});

test('6. Rekomendasi produk fleksibel: mendukung produk yang dibeli bersamaan maupun rekomendasi populer', () => {
  const prod = findProductById(catalog, 'tray-kabel-jepit');
  assert.ok(prod.complementary_ids && prod.complementary_ids.length > 0);
  // Pastikan ID produk yang direkomendasikan ada di katalog
  for (const compId of prod.complementary_ids) {
    const compProd = findProductById(catalog, compId);
    assert.ok(compProd, `Produk rekomendasi ${compId} harus ada di katalog`);
  }
});

test('7. Menjawab intent siapkan pesanan / beli dengan panduan checkout langsung', () => {
  const prod = findProductById(catalog, 'prd-at-002');
  assert.ok(prod);
  const res = generateSalesResponse(prod, 'siapkan pesanan');
  assert.equal(res.status, 200);
  assert.ok(res.body.answer.includes('Beli Sekarang'));
  assert.ok(res.body.closing_cta.url.startsWith('https://'));
});

test('8. Menjawab apa itu pada produk prd-at-002 dengan penjelasan fungsional tanpa error 500', () => {
  const prod = findProductById(catalog, 'prd-at-002');
  assert.ok(prod);
  const res = generateSalesResponse(prod, 'apa itu');
  assert.equal(res.status, 200);
  assert.ok(res.body.answer.includes('solusi'));
  assert.ok(res.body.answer.includes('kubus vertikal'));
});

