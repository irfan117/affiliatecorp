/**
 * worker/test/engine.test.mjs
 * Unit test untuk ranking berbasis masalah, validasi input, guardrail sensitif,
 * dan keamanan redirect /go/:productId (Sesuai Minggu 3-4 ars.md).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateChatInput,
  detectSensitiveContext,
  rankProductsForQuery,
  buildStructuredChatResponse,
  resolveSafeAffiliateRedirect
} from '../src/engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.resolve(__dirname, '../../data/approved/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

test('1. Validasi input menolak pesan kosong atau terlalu panjang & meng-escape HTML', () => {
  assert.equal(validateChatInput({}).valid, false);
  assert.equal(validateChatInput({ message: 'ab' }).valid, false);
  assert.equal(validateChatInput({ message: 'a'.repeat(501) }, 500).valid, false);

  const xssAttempt = validateChatInput({ message: 'Kabel meja <script>alert(1)</script> berantakan' });
  assert.equal(xssAttempt.valid, true);
  assert.equal(xssAttempt.message.includes('<script>'), false);
  assert.equal(xssAttempt.message.includes('&lt;script&gt;'), true);
});

test('2. Guardrail konteks sensitif menolak pertanyaan medis, hukum, dan keuangan', () => {
  const med = detectSensitiveContext('Apa alat yang bisa menyembuhkan diabetes dan saraf kejepit?');
  assert.equal(med.isSensitive, true);
  assert.equal(med.category, 'medis');

  const fin = detectSensitiveContext('Rekomendasi pinjol bunga rendah atau kripto pasti untung');
  assert.equal(fin.isSensitive, true);
  assert.equal(fin.category, 'keuangan');

  const safe = detectSensitiveContext('Meja kerja sempit dan kabel charger selalu berantakan di lantai');
  assert.equal(safe.isSensitive, false);
});

test('3. Ranking katalog berbasis masalah mengembalikan maksimal 3 kandidat relevan dari DB', () => {
  const results = rankProductsForQuery(catalog, 'kabel di bawah meja kerja berantakan dan stop kontak berdebu');
  assert.ok(results.length >= 2 && results.length <= 3);
  assert.equal(results[0].product.category, 'meja-kerja');

  // Filter budget bekerja akurat
  const budgetFiltered = rankProductsForQuery(catalog, 'kabel meja berantakan di bawah 50rb');
  assert.ok(budgetFiltered.length >= 1);
  for (const r of budgetFiltered) {
    assert.ok(r.product.price_min <= 50000);
  }
});

test('4. Kontrak output POST /api/chat tidak pernah mengarang URL (semua dari katalog DB)', () => {
  const res = buildStructuredChatResponse(catalog, {
    message: 'Kamar kos saya lembap, pengap, dan lemari sering bau apek'
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.products.length > 0 && res.body.products.length <= 3);
  assert.ok(res.body.disclosure.includes('afiliasi'));

  const validIds = new Set(catalog.map((p) => p.id));
  const validUrls = new Set(catalog.map((p) => p.affiliate_url));

  for (const p of res.body.products) {
    assert.ok(validIds.has(p.id), 'ID produk wajib berasal dari database');
    assert.ok(validUrls.has(p.affiliateUrl), 'URL afiliasi wajib berasal dari database');
    assert.ok(p.tradeoffs && p.tradeoffs.length > 10, 'Wajib menyertakan catatan risiko/trade-off');
  }
});

test('5. GET /go/:productId memvalidasi produk aktif dan memblokir Open Redirect', () => {
  const validRedirect = resolveSafeAffiliateRedirect(catalog, 'prd-mk-001');
  assert.equal(validRedirect.ok, true);
  assert.equal(validRedirect.status, 302);
  assert.equal(validRedirect.location, 'https://s.shopee.co.id/aff-mk-001-tray-kabel');

  const openRedirectAttempt = resolveSafeAffiliateRedirect(catalog, 'https://evil-phishing.example.com');
  assert.equal(openRedirectAttempt.ok, false);
  assert.equal(openRedirectAttempt.status, 400);

  const unknownProduct = resolveSafeAffiliateRedirect(catalog, 'prd-tidak-ada-999');
  assert.equal(unknownProduct.ok, false);
  assert.equal(unknownProduct.status, 404);
});

