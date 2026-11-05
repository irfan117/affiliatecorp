#!/usr/bin/env node
/**
 * ops/normalize/validate.mjs
 * Normalisasi, pemeriksaan guardrail klaim terlarang (medis/hukum/keuangan),
 * validasi link affiliate, perhitungan quality_score, dan pemisahan ke
 * data/approved/catalog.json serta data/rejected/rejected_items.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const INCOMING_FILE = path.join(ROOT, 'data/incoming/sample_raw_products.json');
const APPROVED_FILE = path.join(ROOT, 'data/approved/catalog.json');
const REJECTED_FILE = path.join(ROOT, 'data/rejected/rejected_items.json');
const MARKETING_CATALOG_FILE = path.join(ROOT, 'data/marketing_sales_catalog.json');

const ALLOWED_CATEGORIES = new Set([
  'meja-kerja',
  'kamar-kos',
  'rumah-praktis',
  'aksesori-tekno',
  'alat-kreatif',
  'kebutuhan-harian'
]);

const PROHIBITED_CLAIM_PATTERNS = [
  /menyembuhkan/i,
  /obat\s+diabetes/i,
  /saraf\s+kejepit/i,
  /tanpa\s+dokter/i,
  /100%\s+sembuh/i,
  /jaminan\s+kaya/i
];

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function computeQualityScore(item) {
  let score = 0;
  if (typeof item.rating === 'number') score += (item.rating / 5) * 40;
  if (typeof item.sales_count === 'number') {
    score += Math.min(25, Math.log10(Math.max(1, item.sales_count)) * 6);
  }
  if (Array.isArray(item.problem_tags) && item.problem_tags.length >= 3) score += 15;
  if (item.tradeoffs && item.tradeoffs.length >= 20) score += 10;
  if (item.image_url && item.image_url.startsWith('https://')) score += 10;
  return Number(score.toFixed(1));
}

function validateItem(item) {
  const errors = [];

  if (!item.id || typeof item.id !== 'string') errors.push('ID produk wajib diisi');
  if (!item.name || item.name.trim().length < 8) errors.push('Nama produk terlalu pendek');
  if (!ALLOWED_CATEGORIES.has(item.category)) {
    errors.push(`Kategori '${item.category}' di luar niche yang diizinkan (${Array.from(ALLOWED_CATEGORIES).join(', ')})`);
  }
  if (!Array.isArray(item.problem_tags) || item.problem_tags.length === 0) {
    errors.push('problem_tags wajib berupa array minimal 1 masalah');
  }
  if (!item.solution_summary || item.solution_summary.trim().length < 20) {
    errors.push('solution_summary terlalu pendek (<20 karakter)');
  }
  if (!item.tradeoffs || item.tradeoffs.trim().length < 15) {
    errors.push('tradeoffs (catatan risiko/hal yang perlu diperiksa) wajib diisi dengan jujur');
  }
  if (typeof item.price_min !== 'number' || typeof item.price_max !== 'number' || item.price_min <= 0 || item.price_max < item.price_min) {
    errors.push(`Kisaran harga tidak valid (price_min: ${item.price_min}, price_max: ${item.price_max})`);
  }
  if (!item.affiliate_url || !/^https:\/\/(s\.shopee\.co\.id|tokopedia\.link)\//i.test(item.affiliate_url)) {
    errors.push('affiliate_url wajib berupa tautan afiliasi resmi HTTPS (s.shopee.co.id / tokopedia.link)');
  }
  if (!item.destination_url || !item.destination_url.startsWith('https://')) {
    errors.push('destination_url wajib berupa HTTPS valid');
  }

  const combinedText = `${item.name} ${item.solution_summary} ${(item.problem_tags || []).join(' ')}`;
  for (const pattern of PROHIBITED_CLAIM_PATTERNS) {
    if (pattern.test(combinedText)) {
      errors.push(`Melanggar guardrail klaim sensitif/medis (${pattern})`);
    }
  }

  return errors;
}

function main() {
  console.log('=== [OPS: VALIDATE & NORMALIZE] Memvalidasi katalog produk ===');
  const rawItems = JSON.parse(fs.readFileSync(INCOMING_FILE, 'utf8'));
  const approved = [];
  const rejected = [];
  const nowIso = new Date().toISOString();

  for (const item of rawItems) {
    const errors = validateItem(item);
    if (errors.length > 0) {
      rejected.push({
        id: item.id,
        name: item.name,
        category: item.category,
        rejected_at: nowIso,
        reasons: errors,
        raw: item
      });
      continue;
    }

    const normalized = {
      id: item.id.trim(),
      source: item.source,
      source_product_id: item.source_product_id || null,
      name: item.name.trim(),
      slug: `${slugify(item.name)}-${item.id.toLowerCase()}`,
      category: item.category,
      problem_tags: Array.from(new Set((item.problem_tags || []).map((t) => t.trim().toLowerCase()))),
      solution_summary: (item.solution_summary || '').trim(),
      tradeoffs: (item.tradeoffs || '').trim(),
      price_min: item.price_min,
      price_max: item.price_max,
      currency: item.currency || 'IDR',
      rating: typeof item.rating === 'number' ? item.rating : 4.8,
      sales_count: typeof item.sales_count === 'number' ? item.sales_count : 100,
      image_url: item.image_url || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
      destination_url: item.destination_url || item.affiliate_url,
      affiliate_url: item.affiliate_url,
      source_updated_at: item.source_updated_at || nowIso,
      published_at: item.published_at || nowIso,
      status: item.status === 'published' ? 'published' : 'draft',
      quality_score: computeQualityScore(item),
      created_at: item.source_updated_at || nowIso,
      updated_at: nowIso,
      headline: item.headline || item.solution_summary || item.name,
      price_promo: item.price_promo || `Rp${(item.price_min || 0).toLocaleString('id-ID')}`,
      price_original: item.price_original || `Rp${(item.price_max || item.price_min || 0).toLocaleString('id-ID')}`,
      discount_tag: item.discount_tag || 'Promo Spesial',
      marketplace_name: item.marketplace_name || (item.source && item.source.includes('tokopedia') ? 'Tokopedia Official' : 'Official Store'),
      free_shipping_badge: item.free_shipping_badge || 'Gratis Ongkir',
      specs: item.specs || {},
      sales_points: item.sales_points || (item.problem_tags || []),
      faq: item.faq || [],
      complementary_ids: item.complementary_ids || [],
      bundle_reason: item.bundle_reason || ''
    };
    approved.push(normalized);
  }

  approved.sort((a, b) => b.quality_score - a.quality_score);

  // Jika terdapat katalog marketing/sales yang telah dikurasi, gabungkan tanpa duplikasi
  if (fs.existsSync(MARKETING_CATALOG_FILE)) {
    const marketingItems = JSON.parse(fs.readFileSync(MARKETING_CATALOG_FILE, 'utf8'));
    const approvedIds = new Set(approved.map((p) => p.id));
    for (const mItem of marketingItems) {
      if (!approvedIds.has(mItem.id)) {
        approved.unshift(mItem);
        approvedIds.add(mItem.id);
      }
    }
  }

  fs.writeFileSync(APPROVED_FILE, JSON.stringify(approved, null, 2) + '\n', 'utf8');
  fs.writeFileSync(REJECTED_FILE, JSON.stringify(rejected, null, 2) + '\n', 'utf8');

  console.log(`Disetujui (data/approved/catalog.json)       : ${approved.length} produk`);
  console.log(`Ditolak   (data/rejected/rejected_items.json): ${rejected.length} produk`);
  if (rejected.length > 0) {
    console.log('\nRingkasan item ditolak:');
    for (const r of rejected) {
      console.log(` - [${r.id}] ${r.name}: ${r.reasons.join('; ')}`);
    }
  }
}

main();

