import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReviews, buildProductSalesEntry } from '../../ops/collect/shopee_curator.mjs';

test('1. Evaluator ulasan menyaring komentar negatif & mengapresiasi komentar positif', () => {
  const goodReview = 'Barang sangat kokoh, bahan besi tebal, pas banget di meja kayu saya tidak lecet, puas!';
  const evalGood = evaluateReviews(goodReview);
  assert.equal(evalGood.isApproved, true);
  assert.ok(evalGood.positivePoints.length >= 3);

  const badReview = 'Barang patah saat sampai, cat lecet parah, tipis banget, kecewa bintang 1';
  const evalBad = evaluateReviews(badReview);
  assert.equal(evalBad.isApproved, false);
  assert.ok(evalBad.complaintPoints.length >= 3);
});

test('2. buildProductSalesEntry memformat data produk lengkap dengan link affiliate pengguna', () => {
  const entry = buildProductSalesEntry({
    name: 'Tray Kabel Besi Clamp Meja Kerja',
    headline: 'Merapikan kabel meja tanpa bor',
    category: 'meja-kerja',
    price_promo: 'Rp65.000',
    affiliate_url: 'https://s.shopee.co.id/my-affiliate-link-123',
    rating: 4.9,
    sales_count: 5000
  });

  assert.equal(entry.id, 'tray-kabel-besi-clamp-meja-kerja');
  assert.equal(entry.affiliate_url, 'https://s.shopee.co.id/my-affiliate-link-123');
  assert.equal(entry.rating, 4.9);
  assert.ok(entry.faq.length >= 2);
});

