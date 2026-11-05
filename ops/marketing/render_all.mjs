#!/usr/bin/env node
/**
 * ops/marketing/render_all.mjs
 * Script Batch Render Video Remotion untuk Seluruh Katalog
 * 
 * Penggunaan:
 *   node ops/marketing/render_all.mjs
 *   node ops/marketing/render_all.mjs <productId>
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CALENDAR_FILE = path.join(ROOT, 'data/marketing/content_calendar.json');
const REMOTION_DIR = path.join(ROOT, 'remotion-studio');
const OUT_DIR = path.join(REMOTION_DIR, 'out');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

if (!fs.existsSync(CALENDAR_FILE)) {
  console.error('File kalender tidak ditemukan. Jalankan terlebih dahulu: npm run marketing:plan');
  process.exit(1);
}

const campaigns = JSON.parse(fs.readFileSync(CALENDAR_FILE, 'utf8'));
const targetId = process.argv[2];

const selectedCampaigns = targetId
  ? campaigns.filter((c) => c.productId === targetId || c.campaignId === targetId)
  : campaigns;

if (selectedCampaigns.length === 0) {
  console.error(`Tidak ada kampanye yang cocok dengan "${targetId}".`);
  process.exit(1);
}

console.log('========================================================================');
console.log(`🎬 REMOTION BATCH VIDEO RENDERER (${selectedCampaigns.length} Video)`);
console.log('Format: 1080x1920 Vertikal (TikTok / Reels / Shorts 9:16) @ 30fps');
console.log('========================================================================\n');

for (let i = 0; i < selectedCampaigns.length; i++) {
  const c = selectedCampaigns[i];
  const outMp4 = path.join(OUT_DIR, `${c.productId}.mp4`);
  const propsPath = path.join(ROOT, 'data/marketing/props', `${c.productId}.json`);

  console.log(`[${i + 1}/${selectedCampaigns.length}] Me-render [${c.campaignId}] - ${c.productName}`);
  console.log(`Output: out/${c.productId}.mp4`);

  const renderCmd = `npx remotion render src/index.ts ProductAdVideo out/${c.productId}.mp4 --props="../data/marketing/props/${c.productId}.json"`;

  try {
    execSync(renderCmd, {
      cwd: REMOTION_DIR,
      stdio: 'inherit'
    });
    c.status = 'rendered';
    console.log(`✅ Berhasil me-render: out/${c.productId}.mp4\n`);
  } catch (err) {
    console.error(`❌ Gagal me-render video ${c.productId}:`, err.message);
  }
}

// Simpan update status di kalender
fs.writeFileSync(CALENDAR_FILE, JSON.stringify(campaigns, null, 2) + '\n', 'utf8');

console.log('========================================================================');
console.log('🎉 Selesai! Semua file video MP4 tersimpan di direktori: remotion-studio/out/');
console.log('========================================================================');

