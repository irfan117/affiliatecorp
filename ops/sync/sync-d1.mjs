#!/usr/bin/env node
/**
 * ops/sync/sync-d1.mjs
 * Menyinkronkan data produk iklan dari data/approved/catalog.json
 * ke D1 SQL migration dan ke frontend web (src/data/salesProducts.ts).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const APPROVED_FILE = path.join(ROOT, 'data/approved/catalog.json');
const WEB_SALES_TS = path.join(ROOT, 'cloudflare-shopify-assistant/src/data/salesProducts.ts');
const WEB_ALT_SALES_TS = path.join(ROOT, 'web/src/data/salesProducts.ts');
const D1_SEED_SQL = path.join(ROOT, 'db/migrations/0002_seed_catalog.sql');

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

function main() {
  console.log('=== [OPS: SYNC SALES PRODUCTS] Menyinkronkan Produk Iklan ke Web & D1 ===');
  if (!fs.existsSync(APPROVED_FILE)) {
    console.error('File data/approved/catalog.json tidak ditemukan.');
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(APPROVED_FILE, 'utf8'));

  const tsContent = `// Dihasilkan otomatis oleh ops/sync/sync-d1.mjs
// Produk yang diiklankan di media sosial (TikTok, Instagram, Facebook, Shorts)

export interface ProductSpecs {
  material?: string;
  dimensions?: string;
  table_compatibility?: string;
  compatibility?: string;
  installation?: string;
  capacity?: string;
  protection?: string;
  power?: string;
  water_tank?: string;
  safety?: string;
  noise?: string;
  coverage?: string;
  output?: string;
  ports?: string;
  optics?: string;
  light_modes?: string;
  power_source?: string;
  fit?: string;
  monitor_size?: string;
  monitor_weight?: string;
  vesa_standard?: string;
  installation_modes?: string;
  flexibility?: string;
  features?: string;
  [key: string]: string | undefined;
}

export interface ProductFaq {
  q: string;
  a: string;
}

export interface AdvertisedProduct {
  id: string;
  name: string;
  headline: string;
  category: string;
  price_promo: string;
  price_original: string;
  discount_tag: string;
  rating: number;
  sales_count: number;
  image_url: string;
  destination_url: string;
  affiliate_url: string;
  marketplace_name: string;
  free_shipping_badge: string;
  complementary_ids?: string[];
  bundle_reason?: string;
  specs: ProductSpecs;
  sales_points: string[];
  faq: ProductFaq[];
  status: string;
  recommendation_badge?: string;
  recommendation_reason?: string;
  [key: string]: any;
}

export const ADVERTISED_PRODUCTS: AdvertisedProduct[] = ${JSON.stringify(catalog, null, 2)};
`;

  fs.writeFileSync(WEB_SALES_TS, tsContent, 'utf8');
  console.log(`Katalog Sales Web berhasil dibuat : ${WEB_SALES_TS} (${catalog.length} produk iklan)`);

  if (fs.existsSync(path.dirname(WEB_ALT_SALES_TS))) {
    fs.writeFileSync(WEB_ALT_SALES_TS, tsContent, 'utf8');
    console.log(`Katalog Sales Web (alt) berhasil dibuat : ${WEB_ALT_SALES_TS}`);
  }

  // Generate D1 Migration SQL (for all canonical products starting with prd-)
  const canonicalItems = catalog.filter((item) => item.id && item.id.startsWith('prd-'));
  const sqlLines = [
    '-- Migration 0002: Seed Katalog Produk Tervalidasi (Dihasilkan otomatis oleh ops/sync/sync-d1.mjs)',
    '-- Jangan mengedit manual; jalankan `npm run ops:validate && npm run ops:sync` dari VS Code.',
    ''
  ];

  for (const item of canonicalItems) {
    const id = sqlEscape(item.id);
    const source = sqlEscape(item.source || 'shopee_affiliate_feed');
    const source_product_id = sqlEscape(item.source_product_id || null);
    const name = sqlEscape(item.name);
    const slug = sqlEscape(item.slug || `${item.id}`);
    const category = sqlEscape(item.category || 'kebutuhan-harian');
    const problem_tags = sqlEscape(JSON.stringify(item.problem_tags || [item.headline || item.name]));
    const solution_summary = sqlEscape(item.solution_summary || item.headline || item.name);
    const tradeoffs = sqlEscape(item.tradeoffs || 'Gunakan sesuai petunjuk produk.');
    const price_min = sqlEscape(item.price_min || 0);
    const price_max = sqlEscape(item.price_max || item.price_min || 0);
    const currency = sqlEscape(item.currency || 'IDR');
    const rating = sqlEscape(item.rating || 4.8);
    const sales_count = sqlEscape(item.sales_count || 1000);
    const image_url = sqlEscape(item.image_url || '');
    const destination_url = sqlEscape(item.destination_url || item.affiliate_url || '');
    const affiliate_url = sqlEscape(item.affiliate_url || '');
    const source_updated_at = sqlEscape(item.source_updated_at || new Date().toISOString());
    const published_at = sqlEscape(item.published_at || new Date().toISOString());
    const status = sqlEscape(item.status || 'published');
    const quality_score = sqlEscape(item.quality_score || 95.0);
    const created_at = sqlEscape(item.created_at || new Date().toISOString());
    const updated_at = sqlEscape(item.updated_at || new Date().toISOString());

    sqlLines.push(
      `INSERT OR REPLACE INTO products (id, source, source_product_id, name, slug, category, problem_tags, solution_summary, tradeoffs, price_min, price_max, currency, rating, sales_count, image_url, destination_url, affiliate_url, source_updated_at, published_at, status, quality_score, created_at, updated_at) VALUES (${id}, ${source}, ${source_product_id}, ${name}, ${slug}, ${category}, ${problem_tags}, ${solution_summary}, ${tradeoffs}, ${price_min}, ${price_max}, ${currency}, ${rating}, ${sales_count}, ${image_url}, ${destination_url}, ${affiliate_url}, ${source_updated_at}, ${published_at}, ${status}, ${quality_score}, ${created_at}, ${updated_at});`
    );
  }

  fs.writeFileSync(D1_SEED_SQL, sqlLines.join('\n') + '\n', 'utf8');
  console.log(`D1 Seed SQL migration berhasil dibuat : ${D1_SEED_SQL} (${canonicalItems.length} produk kanonikal)`);
}

main();
