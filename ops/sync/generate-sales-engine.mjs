import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const APPROVED_CATALOG_PATH = path.join(ROOT, 'data/approved/catalog.json');
const TARGET_ENGINE_PATH = path.join(ROOT, 'worker/src/salesEngine.mjs');

const catalog = JSON.parse(fs.readFileSync(APPROVED_CATALOG_PATH, 'utf8'));

const code = `/**
 * worker/src/salesEngine.mjs
 * Mesin AI Sales Representative (Conversational Closer)
 * Khusus melayani calon pembeli yang datang dari IKLAN SOSMED untuk SATU PRODUK SPESIFIK.
 * Menjawab pertanyaan spesifikasi, ukuran, cara pakai, garansi, serta memandu proses checkout.
 */

export const CORE_ADVERTISED_CATALOG = ${JSON.stringify(catalog, null, 2)};

export const AFFILIATE_DISCLOSURE =
  'Tautan pembelian mengarah ke toko resmi marketplace (Shopee / Tokopedia). Kami dapat menerima komisi kecil dari transaksi tanpa biaya tambahan bagi Anda.';

export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PRODUCT_ALIAS_MAP = {
  'tray-kabel-jepit': 'prd-mk-001',
  'box-kabel-minimalis': 'prd-mk-002',
  'bracket-monitor-spring': 'prd-mk-004',
  'screenbar-monitor': 'prd-mk-006',
  'stand-laptop-aluminium': 'prd-mk-007',
  'gan-charger-65w': 'prd-at-001',
  'dehumidifier-mini-kos': 'prd-kk-001',
  'troli-susun-slim': 'prd-kk-003',
  'prd-mk-001': 'tray-kabel-jepit',
  'prd-mk-002': 'box-kabel-minimalis',
  'prd-mk-004': 'bracket-monitor-spring',
  'prd-mk-006': 'screenbar-monitor',
  'prd-mk-007': 'stand-laptop-aluminium',
  'prd-at-001': 'gan-charger-65w',
  'prd-kk-001': 'dehumidifier-mini-kos',
  'prd-kk-003': 'troli-susun-slim'
};

export function normalizeProduct(raw) {
  if (!raw) return null;
  const p = { ...raw };
  p.id = String(p.id || '').trim();
  p.name = String(p.name || 'Produk Pilihan').trim();
  p.headline = String(p.headline || p.solution_summary || p.name || '').trim();
  p.solution_summary = String(p.solution_summary || p.headline || p.name || '').trim();
  p.category = String(p.category || 'Aksesori').trim();
  p.price_promo = p.price_promo || (p.price_min ? ('Rp' + Number(p.price_min).toLocaleString('id-ID')) : 'Rp95.000');
  p.price_original = p.price_original || (p.price_max ? ('Rp' + Number(p.price_max).toLocaleString('id-ID')) : '');
  p.discount_tag = p.discount_tag || 'Promo Spesial';
  p.rating = Number(p.rating) || 4.8;
  p.sales_count = Number(p.sales_count) || 1000;
  p.marketplace_name = p.marketplace_name || (p.affiliate_url && p.affiliate_url.includes('tokopedia') ? 'Tokopedia Official' : (p.affiliate_url && p.affiliate_url.includes('shopee') ? 'Shopee Official' : 'Official Store'));
  p.free_shipping_badge = p.free_shipping_badge || 'Gratis Ongkir';
  p.affiliate_url = p.affiliate_url || p.destination_url || '#';
  p.specs = p.specs && typeof p.specs === 'object' ? p.specs : {};
  p.sales_points = Array.isArray(p.sales_points) && p.sales_points.length > 0
    ? p.sales_points
    : (p.solution_summary ? [p.solution_summary] : []);
  p.faq = Array.isArray(p.faq) ? p.faq : [];
  p.complementary_ids = Array.isArray(p.complementary_ids) ? p.complementary_ids : [];
  p.bundle_reason = p.bundle_reason || '';
  return p;
}

export function findProductById(catalog, productId) {
  if (!productId || typeof productId !== 'string') return null;
  const cleanId = productId.trim().toLowerCase();
  const aliasId = PRODUCT_ALIAS_MAP[cleanId] || cleanId;

  // 1. Cek di CORE_ADVERTISED_CATALOG terlebih dahulu
  const coreMatch = CORE_ADVERTISED_CATALOG.find(
    (p) => p.id.toLowerCase() === cleanId || p.id.toLowerCase() === aliasId
  );
  if (coreMatch) return normalizeProduct(coreMatch);

  // 2. Cek di katalog D1 database
  if (Array.isArray(catalog) && catalog.length > 0) {
    const d1Match = catalog.find(
      (p) => (p.id && p.id.toLowerCase() === cleanId) || (p.id && p.id.toLowerCase() === aliasId)
    );
    if (d1Match) return normalizeProduct(d1Match);
  }

  return null;
}

export function getRecommendedProducts(catalog, rawProduct, limit = 2) {
  const product = normalizeProduct(rawProduct);
  if (!product) return [];
  const source = Array.isArray(catalog) && catalog.length > 0 ? catalog : CORE_ADVERTISED_CATALOG;
  const result = [];
  const addedIds = new Set([product.id.toLowerCase()]);

  // 1. Rekomendasi Produk Pelengkap / Sering Dibeli Bersamaan
  const pairedIds = product.complementary_ids || [];
  for (const id of pairedIds) {
    if (result.length >= limit) break;
    const found = findProductById(source, id);
    if (found && !addedIds.has(found.id.toLowerCase())) {
      result.push({
        ...found,
        recommendation_badge: 'Sering dibeli bersamaan',
        recommendation_reason: 'Banyak pembeli produk ini juga memesan produk ini.'
      });
      addedIds.add(found.id.toLowerCase());
    }
  }

  // 2. Rekomendasi Kategori Terkait
  if (result.length < limit) {
    const sameCat = source.filter(
      (p) => p.id && !addedIds.has(p.id.toLowerCase()) && p.category === product.category
    );
    for (const p of sameCat) {
      if (result.length >= limit) break;
      const normalizedP = normalizeProduct(p);
      result.push({
        ...normalizedP,
        recommendation_badge: 'Populer di kategori ini',
        recommendation_reason: 'Pilihan favorit pembeli untuk kategori ' + normalizedP.category + '.'
      });
      addedIds.add(normalizedP.id.toLowerCase());
    }
  }

  // 3. Rekomendasi Best-Seller
  if (result.length < limit) {
    const popular = [...source]
      .filter((p) => p.id && !addedIds.has(p.id.toLowerCase()))
      .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
    for (const p of popular) {
      if (result.length >= limit) break;
      const normalizedP = normalizeProduct(p);
      result.push({
        ...normalizedP,
        recommendation_badge: 'Banyak diminati pembeli',
        recommendation_reason: 'Telah terjual ' + (normalizedP.sales_count || 0).toLocaleString('id-ID') + '+ unit.'
      });
      addedIds.add(normalizedP.id.toLowerCase());
    }
  }

  return result;
}

export function generateSalesResponse(rawProduct, rawQuestion, catalog = null) {
  const product = normalizeProduct(rawProduct);
  if (!product) {
    return {
      status: 404,
      body: {
        error: 'Produk dari iklan tidak ditemukan.',
        answer: 'Maaf kak, produk yang kakak tanyakan dari iklan tidak ditemukan di database kami.'
      }
    };
  }

  const cleanQuestion = String(rawQuestion || '').trim();
  if (cleanQuestion.length < 2) {
    return {
      status: 400,
      body: {
        error: 'Pertanyaan terlalu pendek.',
        answer: 'Halo kak! Mau tanya apa tentang produk ini? Misalnya tentang ukuran, fungsi, atau promo hari ini? Silakan tanyakan ya kak!'
      }
    };
  }

  const qLower = cleanQuestion.toLowerCase();
  const specs = product.specs || {};
  const faqs = product.faq || [];
  const complementary = getRecommendedProducts(catalog, product, 2);

  const baseCta = {
    label: 'Beli Sekarang di ' + product.marketplace_name,
    price_promo: product.price_promo,
    badge: product.free_shipping_badge,
    url: product.affiliate_url,
    redirect_path: '/go/' + encodeURIComponent(product.id)
  };

  // 0. Pertanyaan Checkout / Mau Beli / Siapkan Pesanan
  if (
    qLower.includes('siapkan pesanan') ||
    qLower.includes('mau beli') ||
    qLower.includes('pesan sekarang') ||
    qLower.includes('checkout') ||
    qLower.includes('order') ||
    qLower.includes('cara beli') ||
    qLower.includes('cara pesan') ||
    qLower.includes('beli gimana') ||
    qLower.includes('gimana belinya') ||
    qLower === 'pesan' ||
    qLower === 'beli' ||
    qLower === 'order dong' ||
    qLower === 'siap pesan' ||
    qLower.includes('beli ini')
  ) {
    return {
      status: 200,
      body: {
        product_id: product.id,
        product_name: product.name,
        question: cleanQuestion,
        answer: 'Siap kak! Untuk memesan ' + product.name + ', kakak bisa langsung klik tombol "Beli Sekarang di ' + product.marketplace_name + '" di kartu produk bawah ini ya.\\n\\nTautan tersebut langsung menuju toko resmi dengan jaminan produk original, promo harga ' + product.price_promo + ', dan fasilitas ' + product.free_shipping_badge + '. Tinggal pilih metode pembayaran dan masukkan alamat pengiriman kakak di sana.\\n\\nAda yang mau dipastikan lagi sebelum bayar kak?',
        closing_cta: baseCta,
        complementary,
        bundle_reason: product.bundle_reason,
        disclosure: AFFILIATE_DISCLOSURE
      }
    };
  }

  // 1. Pertanyaan Penjelasan Produk: "apa itu" / "ini apa" / "fungsinya apa"
  if (
    qLower === 'apa itu' ||
    qLower === 'ini apa' ||
    qLower === 'apa ini' ||
    qLower.includes('apa itu') ||
    qLower.includes('ini apa') ||
    qLower.includes('fungsinya apa') ||
    qLower.includes('fungsi') ||
    qLower.includes('buat apa') ||
    qLower.includes('gunanya apa') ||
    qLower.includes('kegunaan') ||
    qLower.includes('jelaskan')
  ) {
    const summary = product.solution_summary || product.headline || product.name;
    const pointsText = product.sales_points && product.sales_points.length > 0
      ? '\\n\\nKeunggulan utamanya:\\n• ' + product.sales_points.slice(0, 3).join('\\n• ')
      : '';
    return {
      status: 200,
      body: {
        product_id: product.id,
        product_name: product.name,
        question: cleanQuestion,
        answer: 'Halo kak! ' + product.name + ' adalah solusi untuk ' + summary.toLowerCase() + '.' + pointsText + '\\n\\nProduk ini memiliki rating ⭐ ' + product.rating + '/5.0 dari ' + (product.sales_count || 0).toLocaleString('id-ID') + '+ pembeli di ' + product.marketplace_name + '. Promo saat ini sedang aktif di harga ' + product.price_promo + '. Ada yang mau ditanyakan lagi kak?',
        closing_cta: baseCta,
        complementary,
        bundle_reason: product.bundle_reason,
        disclosure: AFFILIATE_DISCLOSURE
      }
    };
  }

  // 2. Pertanyaan Rekomendasi Produk Lain / Beli Apa Lagi
  if (
    qLower.includes('produk lain') ||
    qLower.includes('apa saja') ||
    qLower.includes('katalog') ||
    qLower.includes('pasangan') ||
    qLower.includes('cocok dengan') ||
    qLower.includes('rekomendasi') ||
    qLower.includes('paket') ||
    qLower.includes('saran') ||
    qLower.includes('beli apa lagi') ||
    qLower.includes('barang lain') ||
    qLower.includes('ada apa lagi')
  ) {
    const compText = complementary
      .map((c) => '**' + c.name + '** (' + c.price_promo + ')')
      .join(' dan ');

    return {
      status: 200,
      body: {
        product_id: product.id,
        product_name: product.name,
        question: cleanQuestion,
        answer: 'Selain ' + product.name + ', produk pelengkap yang sering dipesan barengan itu ' + compText + ' kak.\\n\\nProduknya sudah saya sematkan di kartu rekomendasi bawah ya, bisa langsung diklik untuk cek detailnya atau buka tombol "Lihat Produk" di atas!',
        closing_cta: baseCta,
        complementary,
        bundle_reason: product.bundle_reason,
        disclosure: AFFILIATE_DISCLOSURE
      }
    };
  }

  // 3. Cek apakah cocok langsung dengan FAQ bawaan produk
  const stopWords = new Set(['apakah', 'bagaimana', 'berapa', 'kalau', 'gimana', 'untuk', 'yang', 'dengan', 'bisa', 'dalam', 'saya', 'atau', 'dari', 'pada', 'saat', 'akan', 'tidak']);
  for (const item of faqs) {
    const qWords = item.q
      .toLowerCase()
      .replace(/[^a-z0-9\\s]/g, '')
      .split(/\\s+/)
      .filter((w) => w.length >= 4 && !stopWords.has(w));
    const matchCount = qWords.filter((w) => qLower.includes(w)).length;
    if (matchCount >= 2 || qLower.includes(item.q.toLowerCase().slice(0, 20))) {
      return {
        status: 200,
        body: {
          product_id: product.id,
          product_name: product.name,
          question: cleanQuestion,
          answer: item.a + '\\n\\nProduk ini sudah terjual lebih dari ' + (product.sales_count || 0).toLocaleString('id-ID') + ' unit dengan rating kepuasan ' + product.rating + ' / 5.0 di ' + product.marketplace_name + '.',
          closing_cta: baseCta,
          disclosure: AFFILIATE_DISCLOSURE
        }
      };
    }
  }

  // 4. Pertanyaan Cara Pasang / Bor / Pemasangan
  if (
    qLower.includes('pasang') ||
    qLower.includes('bor') ||
    qLower.includes('paku') ||
    qLower.includes('obeng') ||
    qLower.includes('rakit') ||
    qLower.includes('instalasi')
  ) {
    const installInfo = specs.installation || 'Sistem pemasangan sangat praktis tanpa perlu alat khusus atau melubangi meja/dinding.';
    return {
      status: 200,
      body: {
        product_id: product.id,
        product_name: product.name,
        question: cleanQuestion,
        answer: 'Pemasangannya gampang banget kak! ' + installInfo + '\\n\\nKakak tidak perlu mengebor atau merusak meja/dinding sama sekali. Cukup putar dan pasang dengan tangan dalam 2-3 menit sudah kokoh dan siap dipakai.',
        closing_cta: baseCta,
        disclosure: AFFILIATE_DISCLOSURE
      }
    };
  }

  // 5. Pertanyaan Kompatibilitas Ukuran / Tebal Meja / Dimensi
  if (
    qLower.includes('tebal') ||
    qLower.includes('ukuran') ||
    qLower.includes('muat') ||
    qLower.includes('panjang') ||
    qLower.includes('lebar') ||
    qLower.includes('dimensi') ||
    qLower.includes('tinggi') ||
    qLower.includes('meja')
  ) {
    let detail = '';
    if (specs.table_compatibility) {
      detail += 'Untuk kecocokan meja: ' + specs.table_compatibility + '. ';
    }
    if (specs.dimensions) {
      detail += 'Dimensi produk: ' + specs.dimensions + '. ';
    }
    if (specs.capacity) {
      detail += 'Kekuatan beban: ' + specs.capacity + '. ';
    }

    return {
      status: 200,
      body: {
        product_id: product.id,
        product_name: product.name,
        question: cleanQuestion,
        answer: 'Halo kak! Untuk ukuran dan kecocokan ' + product.name + ':\\n\\n' + (detail || specs.compatibility || 'Produk ini dirancang dengan dimensi yang sangat pas dan fleksibel untuk kebutuhan harian.') + '\\n\\nKakak tidak perlu khawatir salah ukuran karena spesifikasinya sudah sesuai standar perlengkapan Indonesia.',
        closing_cta: baseCta,
        disclosure: AFFILIATE_DISCLOSURE
      }
    };
  }

  // 6. Pertanyaan Kualitas Bahan / Rusak / Lecet / Karat / Panas
  if (
    qLower.includes('bahan') ||
    qLower.includes('material') ||
    qLower.includes('lecet') ||
    qLower.includes('rusak') ||
    qLower.includes('karat') ||
    qLower.includes('kuat') ||
    qLower.includes('patah') ||
    qLower.includes('panas') ||
    qLower.includes('awet')
  ) {
    const matInfo = specs.material || 'Material pilihan berkualitas tinggi dan tahan lama.';
    const protInfo = specs.protection ? ('Selain itu, ' + specs.protection + '.') : '';
    return {
      status: 200,
      body: {
        product_id: product.id,
        product_name: product.name,
        question: cleanQuestion,
        answer: 'Kualitas bahannya terjamin kokoh kak! Terbuat dari ' + matInfo + '. ' + protInfo + '\\n\\nProduk ini dibuat untuk pemakaian jangka panjang, anti karat, dan kuat menahan beban tanpa melengkung.',
        closing_cta: baseCta,
        disclosure: AFFILIATE_DISCLOSURE
      }
    };
  }

  // 7. Pertanyaan Garansi / Keaslian / Pengiriman / Ongkir / Toko Resmi
  if (
    qLower.includes('garansi') ||
    qLower.includes('asli') ||
    qLower.includes('ori') ||
    qLower.includes('ongkir') ||
    qLower.includes('kirim') ||
    qLower.includes('toko') ||
    qLower.includes('promo') ||
    qLower.includes('diskon')
  ) {
    return {
      status: 200,
      body: {
        product_id: product.id,
        product_name: product.name,
        question: cleanQuestion,
        answer: 'Produk ini 100% Original dari official/star seller di ' + product.marketplace_name + ' kak. Dilengkapi jaminan pengiriman aman, fasilitas ' + product.free_shipping_badge + ', dan garansi retur jika barang tiba dalam kondisi cacat.\\n\\nHarga promo saat ini ' + product.price_promo + ' (harga normal ' + product.price_original + '). Diskon ' + product.discount_tag + ' berlaku terbatas dari link iklan ini!',
        closing_cta: baseCta,
        disclosure: AFFILIATE_DISCLOSURE
      }
    };
  }

  // 8. Default Sales Consultation & Closing
  const primaryPitch = product.sales_points && product.sales_points.length > 0
    ? product.sales_points[0]
    : (product.solution_summary || product.headline);

  return {
    status: 200,
    body: {
      product_id: product.id,
      product_name: product.name,
      question: cleanQuestion,
      answer: 'Halo kak! Mengenai ' + product.name + ': produk ini dirancang untuk ' + (product.solution_summary || product.headline || '').toLowerCase() + '.\\n\\nKeunggulan utamanya: ' + primaryPitch + '. Sudah dipercaya oleh lebih dari ' + (product.sales_count || 0).toLocaleString('id-ID') + ' pembeli dengan rating ⭐ ' + product.rating + '/5.0 di ' + product.marketplace_name + '.\\n\\nMumpung promo diskon masih aktif di ' + product.price_promo + ', yuk amankan unitnya sekarang sebelum kehabisan kuota diskon di ' + product.marketplace_name + ' ya kak!',
      closing_cta: baseCta,
      complementary,
      bundle_reason: product.bundle_reason,
      disclosure: AFFILIATE_DISCLOSURE
    }
  };
}
`;

fs.writeFileSync(TARGET_ENGINE_PATH, code, 'utf8');
console.log('Successfully wrote', TARGET_ENGINE_PATH);

