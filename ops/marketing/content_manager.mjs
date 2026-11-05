#!/usr/bin/env node
/**
 * ops/marketing/content_manager.mjs
 * Tool Manajemen Konten Kreator & Generator Skrip Video Remotion
 * (TikTok / Instagram Reels / YouTube Shorts 9:16 Vertical 1080x1920)
 *
 * Perintah:
 *   node ops/marketing/content_manager.mjs generate
 *   node ops/marketing/content_manager.mjs list
 *   node ops/marketing/content_manager.mjs status <campaignId> <idea|script_ready|rendered|published>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CATALOG_FILE = path.join(ROOT, 'data/approved/catalog.json');
const CALENDAR_FILE = path.join(ROOT, 'data/marketing/content_calendar.json');
const PROPS_DIR = path.join(ROOT, 'data/marketing/props');
const REMOTION_CAMPAIGNS_FILE = path.join(ROOT, 'remotion-studio/src/data/campaigns.json');
const MARKETING_DOC_FILE = path.join(ROOT, 'docs/MARKETING_CONTENT_PLAN.md');

const HOOK_TEMPLATES = {
  'tray-kabel-jepit': 'Kabel di bawah meja berantakan tapi sayang kalau meja harus dibor?',
  'box-kabel-minimalis': 'Stop kontak di atas meja penuh debu dan bikin meja kelihatan semrawut?',
  'bracket-monitor-spring': 'Meja kerja sempit dan leher sering pegal karena posisi monitor terlalu rendah?',
  'screenbar-monitor': 'Mata cepat pedih saat kerja malam di depan monitor karena lampu kamar silau?',
  'stand-laptop-aluminium': 'Laptop cepat panas dan punggung pegal karena menunduk berjam-jam?',
  'gan-charger-65w': 'Tas kerja berat karena harus bawa adaptor laptop besar plus charger HP?',
  'dehumidifier-mini-kos': 'Kamar kos terasa lembap, bau apek, dan lemari pakaian mulai berjamur?',
  'troli-susun-slim': 'Ada celah sempit di samping lemari kos yang kosong tapi barang berceceran?'
};

const PLATFORMS = ['TikTok Video', 'Instagram Reels', 'YouTube Shorts'];

export function buildCampaignFromProduct(product, index, existingMap = new Map()) {
  const campaignId = `vid-${product.id}`;
  const prev = existingMap.get(campaignId);

  const baseDate = new Date('2026-11-06T10:00:00Z');
  baseDate.setDate(baseDate.getDate() + index);
  const scheduledDate = prev?.scheduledDate || baseDate.toISOString().slice(0, 10);

  const hookText =
    HOOK_TEMPLATES[product.id] ||
    `Sering terganggu dengan masalah di ${product.category.toLowerCase()}? Ini solusinya!`;

  const hashtags = [
    '#setupmejakerja',
    '#anakkos',
    '#racunbelanja',
    '#perlengkapanrumah',
    `#${product.category.toLowerCase().replace(/[^a-z0-9]/g, '')}`
  ].join(' ');

  const landingPath = `/?p=${product.id}`;

  const remotionProps = {
    productId: product.id,
    productName: product.name,
    category: product.category,
    hookText,
    headline: product.headline,
    pricePromo: product.price_promo,
    priceOriginal: product.price_original,
    discountTag: product.discount_tag,
    rating: product.rating,
    salesCount: product.sales_count,
    imageUrl: product.image_url,
    badge: product.free_shipping_badge,
    salesPoints: (product.sales_points || []).slice(0, 3),
    ctaUrlText: `Klik Link di Bio (${landingPath})`
  };

  return {
    campaignId,
    productId: product.id,
    productName: product.name,
    category: product.category,
    platform: prev?.platform || PLATFORMS[index % PLATFORMS.length],
    status: prev?.status || 'script_ready',
    scheduledDate,
    landingPath,
    affiliateUrl: product.affiliate_url,
    script: {
      scene1_hook_0_3s: hookText,
      scene2_showcase_3_7s: `${product.name} — ${product.headline}`,
      scene3_benefits_7_12s: (product.sales_points || []).slice(0, 3),
      scene4_cta_12_15s: `Promo ${product.price_promo} (${product.discount_tag}). Tanya asisten kami atau pesan lewat link di bio: ${landingPath}`
    },
    caption: `${hookText}\n\n${product.headline}\n• ${(product.sales_points || []).join('\n• ')}\n\nTanya ukuran & kecocokan atau pesan langsung di link bio (${landingPath})\n\n${hashtags}`,
    remotionProps,
    renderCommand: `npx --prefix remotion-studio remotion render src/index.ts ProductAdVideo out/${product.id}.mp4 --props=../data/marketing/props/${product.id}.json`
  };
}

export function generateAllCampaigns() {
  if (!fs.existsSync(CATALOG_FILE)) {
    throw new Error(`Katalog tidak ditemukan: ${CATALOG_FILE}`);
  }
  const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));

  const existingMap = new Map();
  if (fs.existsSync(CALENDAR_FILE)) {
    try {
      const oldList = JSON.parse(fs.readFileSync(CALENDAR_FILE, 'utf8'));
      for (const item of oldList) {
        existingMap.set(item.campaignId, item);
      }
    } catch {
      // ignore
    }
  }

  fs.mkdirSync(PROPS_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(REMOTION_CAMPAIGNS_FILE), { recursive: true });

  const campaigns = catalog.map((prod, idx) =>
    buildCampaignFromProduct(prod, idx, existingMap)
  );

  // Simpan kalender konten
  fs.writeFileSync(CALENDAR_FILE, JSON.stringify(campaigns, null, 2) + '\n', 'utf8');

  // Simpan masing-masing file props JSON untuk CLI Remotion render
  for (const camp of campaigns) {
    const propFile = path.join(PROPS_DIR, `${camp.productId}.json`);
    fs.writeFileSync(propFile, JSON.stringify(camp.remotionProps, null, 2) + '\n', 'utf8');
  }

  // Simpan ke remotion-studio/src/data/campaigns.json
  fs.writeFileSync(
    REMOTION_CAMPAIGNS_FILE,
    JSON.stringify(campaigns, null, 2) + '\n',
    'utf8'
  );

  // Buat dokumen Markdown ringkasan manajemen konten
  writeMarkdownPlan(campaigns);

  return campaigns;
}

function writeMarkdownPlan(campaigns) {
  const lines = [
    '# Dashboard Manajemen Konten & Video Remotion',
    '',
    `**Total Kampanye Video (9:16 Vertical 1080x1920):** ${campaigns.length} video siap produksi`,
    '',
    '## 1. Jadwal & Status Konten Kreator',
    '',
    '| ID Kampanye | Jadwal | Platform | Status | Produk | Link Bio Target |',
    '|---|---|---|---|---|---|',
    ...campaigns.map(
      (c) =>
        `| \`${c.campaignId}\` | ${c.scheduledDate} | ${c.platform} | **${c.status.toUpperCase()}** | ${c.productName} | \`${c.landingPath}\` |`
    ),
    '',
    '## 2. Storyboard, Caption, & Perintah Render Remotion',
    ''
  ];

  for (const c of campaigns) {
    lines.push(`### [${c.campaignId}] ${c.productName}`);
    lines.push(`- **Jadwal & Platform:** ${c.scheduledDate} (${c.platform}) — Status: \`${c.status}\``);
    lines.push(`- **Scene 1 (0–3s Hook):** "${c.script.scene1_hook_0_3s}"`);
    lines.push(`- **Scene 2 (3–7s Showcase):** ${c.script.scene2_showcase_3_7s}`);
    lines.push(`- **Scene 3 (7–12s Value Points):**`);
    for (const pt of c.script.scene3_benefits_7_12s) {
      lines.push(`  - ${pt}`);
    }
    lines.push(`- **Scene 4 (12–15s Closing CTA):** ${c.script.scene4_cta_12_15s}`);
    lines.push(`- **Caption Siap Copy:**`);
    lines.push('```text');
    lines.push(c.caption);
    lines.push('```');
    lines.push(`- **Render Video MP4 dengan Remotion:**`);
    lines.push('```bash');
    lines.push(c.renderCommand);
    lines.push('```');
    lines.push('');
  }

  fs.writeFileSync(MARKETING_DOC_FILE, lines.join('\n'), 'utf8');
}

function updateCampaignStatus(campaignId, newStatus) {
  const allowed = new Set(['idea', 'script_ready', 'rendered', 'published']);
  if (!allowed.has(newStatus)) {
    console.error(`Status tidak valid: ${newStatus}. Pilih salah satu: idea, script_ready, rendered, published`);
    process.exit(1);
  }
  const campaigns = generateAllCampaigns();
  const found = campaigns.find((c) => c.campaignId === campaignId || c.productId === campaignId);
  if (!found) {
    console.error(`Kampanye "${campaignId}" tidak ditemukan.`);
    process.exit(1);
  }
  found.status = newStatus;
  fs.writeFileSync(CALENDAR_FILE, JSON.stringify(campaigns, null, 2) + '\n', 'utf8');
  writeMarkdownPlan(campaigns);
  console.log(`Status kampanye [${found.campaignId}] berhasil diubah menjadi: ${newStatus.toUpperCase()}`);
}

function printSummary(campaigns) {
  console.log('========================================================================');
  console.log('🎬 CONTENT CREATOR MANAGER & REMOTION VIDEO PIPELINE');
  console.log('========================================================================');
  console.log(`Total Konten Video Terdaftar : ${campaigns.length} Kampanye (1080x1920 @ 30fps, 15 detik)\n`);

  for (const c of campaigns) {
    console.log(`[${c.status.toUpperCase()}] ${c.campaignId} | ${c.scheduledDate} | ${c.platform}`);
    console.log(`   Produk  : ${c.productName}`);
    console.log(`   Hook    : "${c.script.scene1_hook_0_3s}"`);
    console.log(`   Target  : ${c.landingPath}`);
    console.log(`   Render  : ${c.renderCommand}\n`);
  }

  console.log('File Kalender Konten : data/marketing/content_calendar.json');
  console.log('File Props Remotion  : data/marketing/props/*.json');
  console.log('Dokumentasi Lengkap  : docs/MARKETING_CONTENT_PLAN.md');
  console.log('========================================================================');
}

function printStatusTable(campaigns) {
  console.log('========================================================================');
  console.log('📊 STATUS KONTEN KREATOR AFILIATCORP');
  console.log('========================================================================');
  console.log(
    '| Status        | ID Kampanye          | Platform        | Jadwal     | Produk'
  );
  console.log(
    '|---------------|----------------------|-----------------|------------|-----------------------'
  );
  for (const c of campaigns) {
    const st = `[${c.status.toUpperCase()}]`.padEnd(14);
    const id = c.campaignId.padEnd(20);
    const pf = c.platform.padEnd(15);
    const dt = c.scheduledDate.padEnd(10);
    console.log(`| ${st}| ${id} | ${pf} | ${dt} | ${c.productName}`);
  }
  console.log('========================================================================');
  console.log('Ganti status kampanye:');
  console.log('  node ops/marketing/content_manager.mjs status <campaignId> <idea|script_ready|rendered|published>');
  console.log('========================================================================');
}

function main() {
  const cmd = process.argv[2] || 'generate';
  if (cmd === 'status') {
    const id = process.argv[3];
    const st = process.argv[4];
    if (id && st) {
      updateCampaignStatus(id, st);
      return;
    }
    // Jika hanya 'status' tanpa parameter, tampilkan tabel status
    const campaigns = generateAllCampaigns();
    printStatusTable(campaigns);
    return;
  }

  if (cmd === 'set-status') {
    const id = process.argv[3];
    const st = process.argv[4];
    if (!id || !st) {
      console.error('Penggunaan: node ops/marketing/content_manager.mjs set-status <campaignId> <status>');
      process.exit(1);
    }
    updateCampaignStatus(id, st);
    return;
  }

  const campaigns = generateAllCampaigns();
  printSummary(campaigns);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
