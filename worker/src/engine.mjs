/**
 * worker/src/engine.mjs
 * Mesin inti validasi input, deteksi konteks sensitif, normalisasi sinonim bahasa Indonesia,
 * problem-based ranking katalog, penyusunan jawaban terstruktur, dan validasi safe redirect.
 * Sesuai Bagian 9 & 10 ars.md:
 * - AI/sistem tidak pernah mengarang URL, harga, atau atribut produk.
 * - Jika konteks sensitif (medis, hukum, keselamatan, keuangan), tolak nasihat profesional.
 */

export const DEFAULT_DISCLOSURE =
  'Tautan tertentu adalah tautan afiliasi marketplace resmi. Kami dapat memperoleh komisi tanpa biaya tambahan bagi Anda.';

const SENSITIVE_PATTERNS = [
  {
    category: 'medis',
    regex: /\b(obat|penyakit|diabetes|jantung|saraf\s+kejepit|kanker|resep\s+dokter|menyembuhkan|terapi\s+medis|depresi\s+klinis)\b/i,
    warning:
      'Maaf, kami adalah asisten belanja perlengkapan fungsional rumah/kerja dan tidak dapat memberikan saran medis, diagnosis, atau rekomendasi alat kesehatan/obat. Silakan berkonsultasi langsung dengan dokter atau tenaga medis profesional.'
  },
  {
    category: 'hukum',
    regex: /\b(gugatan|pengacara|pidana|perdata|sengketa\s+hukum|pajak\s+ilegal|pemalsuan)\b/i,
    warning:
      'Maaf, kami tidak dapat memberikan nasihat hukum atau produk terkait layanan legal. Silakan hubungi konsultan hukum atau lembaga bantuan hukum resmi.'
  },
  {
    category: 'keuangan',
    regex: /\b(pinjol|investasi\s+pasti\s+untung|kripto|saham\s+gorengan|utang\s+bank|trading\s+forex)\b/i,
    warning:
      'Maaf, kami tidak memberikan saran keuangan, pinjaman, atau investasi. Untuk keputusan finansial, rujuk ke perencana keuangan berlisensi atau informasi resmi OJK.'
  },
  {
    category: 'keselamatan',
    regex: /\b(modifikasi\s+instalasi\s+pln|sambung\s+kabel\s+induk|bahan\s+peledak|senjata|racun\s+berbahaya)\b/i,
    warning:
      'Demi keselamatan, kami tidak merekomendasikan modifikasi listrik tegangan tinggi atau barang berbahaya. Gunakan teknisi bersertifikat PLN/SNI untuk instalasi listrik utama.'
  }
];

const KEYWORD_SYNONYMS = {
  kabel: ['kabel', 'colokan', 'stop kontak', 'charger', 'adaptor', 'tray', 'klip', 'velcro', 'terminal'],
  berantakan: ['berantakan', 'semrawut', 'kusut', 'menjuntai', 'rapi', 'organizer', 'tercecer'],
  sempit: ['sempit', 'kecil', 'hemat ruang', 'penuh', 'minimalis', 'lipat', 'slim', 'celah'],
  pegal: ['pegal', 'sakit leher', 'ergonomis', 'posisi layar', 'tinggi', 'monitor', 'stand laptop'],
  panas: ['panas', 'overheat', 'sirkulasi', 'aluminium', 'gan'],
  lembap: ['lembap', 'lembab', 'bau apek', 'jamur', 'berjamur', 'pengap', 'dehumidifier', 'silica'],
  gelap: ['gelap', 'silau', 'mata lelah', 'lampu', 'screen bar', 'pencahayaan'],
  jemur: ['jemur', 'jemuran', 'baju basah', 'susah kering', 'pakaian'],
  dapur: ['dapur', 'wastafel', 'kulkas', 'sayur', 'masak', 'food prep'],
  lantai: ['lantai', 'pel', 'kotor', 'spray mop'],
  colokan: ['colokan', 'stop kontak', 'lubang', 'port', 'usb', 'hub', 'charger', 'gan']
};

export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function validateChatInput(payload, maxLen = 500) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload harus berupa JSON objek.' };
  }
  const rawMessage = typeof payload.message === 'string' ? payload.message.trim() : '';
  if (!rawMessage) {
    return { valid: false, error: 'Pesan tidak boleh kosong. Ceritakan masalah atau kebutuhan belanja Anda.' };
  }
  if (rawMessage.length < 4) {
    return { valid: false, error: 'Pesan terlalu pendek. Jelaskan sedikit lebih detail masalah Anda.' };
  }
  if (rawMessage.length > maxLen) {
    return { valid: false, error: `Pesan melebihi batas maksimal ${maxLen} karakter.` };
  }
  return {
    valid: true,
    message: escapeHtml(rawMessage),
    rawMessage,
    sessionId: typeof payload.sessionId === 'string' ? payload.sessionId.slice(0, 64) : 'anon'
  };
}

export function detectSensitiveContext(message) {
  const text = String(message || '');
  for (const item of SENSITIVE_PATTERNS) {
    if (item.regex.test(text)) {
      return {
        isSensitive: true,
        category: item.category,
        warning: item.warning
      };
    }
  }
  return { isSensitive: false };
}

export function extractBudgetMax(message) {
  const text = String(message || '').toLowerCase();
  // Contoh: "di bawah 100rb", "budget 150 ribu", "maksimal 80k", "< 100.000"
  const rbMatch = text.match(/(?:di\s*bawah|maks(?:imal)?|budget|kurang\s*dari|<)\s*(?:rp\.?\s*)?(\d+)\s*(rb|ribu|k)\b/i);
  if (rbMatch) {
    return parseInt(rbMatch[1], 10) * 1000;
  }
  const fullMatch = text.match(/(?:di\s*bawah|maks(?:imal)?|budget|kurang\s*dari|<)\s*(?:rp\.?\s*)?(\d{2,3})[.,](\d{3})\b/i);
  if (fullMatch) {
    return parseInt(fullMatch[1] + fullMatch[2], 10);
  }
  return null;
}

export function rankProductsForQuery(catalog, rawQuery, options = {}) {
  const queryLower = String(rawQuery || '').toLowerCase();
  const tokens = queryLower
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  const expandedTokens = new Set(tokens);
  for (const t of tokens) {
    for (const [key, syns] of Object.entries(KEYWORD_SYNONYMS)) {
      if (t.includes(key) || syns.some((s) => s.includes(t))) {
        syns.forEach((s) => expandedTokens.add(s));
      }
    }
  }

  const budgetMax = options.budgetMax ?? extractBudgetMax(rawQuery);
  const categoryFilter = options.category && options.category !== 'all' ? options.category : null;

  const scored = [];
  for (const product of catalog) {
    if (product.status !== 'published') continue;
    if (categoryFilter && product.category !== categoryFilter) continue;
    if (budgetMax && product.price_min > budgetMax) continue;

    let matchScore = 0;
    const matchedProblems = [];
    const nameLower = product.name.toLowerCase();
    const summaryLower = product.solution_summary.toLowerCase();
    const tags = Array.isArray(product.problem_tags) ? product.problem_tags : [];

    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      if (queryLower.includes(tagLower)) {
        matchScore += 35;
        matchedProblems.push(tag);
      } else {
        const tagWords = tagLower.split(/\s+/).filter((w) => w.length >= 3);
        const wordHits = tagWords.filter((w) => expandedTokens.has(w) || queryLower.includes(w));
        if (wordHits.length > 0) {
          matchScore += wordHits.length * 10;
          matchedProblems.push(tag);
        }
      }
    }

    for (const token of expandedTokens) {
      if (nameLower.includes(token)) matchScore += 6;
      if (summaryLower.includes(token)) matchScore += 4;
    }

    if (matchScore > 0) {
      const totalScore = matchScore + (product.quality_score || 0) * 0.25;
      scored.push({
        product,
        score: Number(totalScore.toFixed(2)),
        matchedProblems: Array.from(new Set(matchedProblems)).slice(0, 3)
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}

export function formatPriceRange(min, max) {
  const fmt = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID');
  if (!min && !max) return 'Cek harga di marketplace';
  if (!max || min === max) return `${fmt(min)} (dapat berubah)`;
  return `${fmt(min)} – ${fmt(max)}`;
}

export function buildStructuredChatResponse(catalog, payload, options = {}) {
  const validation = validateChatInput(payload);
  if (!validation.valid) {
    return {
      status: 400,
      body: {
        error: validation.error,
        answer: validation.error,
        products: [],
        disclosure: DEFAULT_DISCLOSURE
      }
    };
  }

  const sensitive = detectSensitiveContext(validation.rawMessage);
  if (sensitive.isSensitive) {
    return {
      status: 200,
      body: {
        understoodNeed: `Pertanyaan terdeteksi menyangkut ranah sensitif (${sensitive.category}).`,
        answer: sensitive.warning,
        tradeoffsWarning: 'Jangan gunakan rekomendasi belanja umum untuk menggantikan konsultasi ahli berlisensi.',
        products: [],
        disclosure: DEFAULT_DISCLOSURE,
        topic: `sensitive:${sensitive.category}`
      }
    };
  }

  const budgetMax = options.budgetMax ?? extractBudgetMax(validation.rawMessage);
  const ranked = rankProductsForQuery(catalog, validation.rawMessage, {
    category: options.category,
    budgetMax
  });

  if (ranked.length === 0) {
    const clarifyMsg = budgetMax
      ? `Belum ada produk tervalidasi di katalog kami yang cocok dengan masalah tersebut untuk batas budget Rp${budgetMax.toLocaleString('id-ID')}. Coba longgarkan filter budget atau ceritakan apakah masalah utamanya di meja kerja, kamar kos, dapur/rumah, atau colokan/gadget.`
      : 'Belum ada rekomendasi yang cukup yakin dari katalog tervalidasi kami untuk pertanyaan tersebut. Bisa ceritakan lebih spesifik masalahnya? (Contoh: "kabel di bawah meja semrawut", "kamar kos lembap dan bau apek", atau "leher pegal kerja pakai laptop").';

    return {
      status: 200,
      body: {
        understoodNeed: `Mencari solusi untuk: "${validation.message}"`,
        answer: clarifyMsg,
        tradeoffsWarning: 'Kami hanya menampilkan produk dari katalog yang sudah diverifikasi, bukan mengarang produk.',
        products: [],
        disclosure: DEFAULT_DISCLOSURE,
        topic: 'unmatched'
      }
    };
  }

  const topTopic = ranked[0].matchedProblems[0] || ranked[0].product.category;
  const budgetNote = budgetMax ? ` dengan batas budget di bawah Rp${budgetMax.toLocaleString('id-ID')}` : '';
  const understoodNeed = `Anda membutuhkan solusi untuk mengatasi **${topTopic}**${budgetNote} agar ruang lebih rapi, nyaman, dan fungsional.`;

  const productsOut = ranked.map((item, idx) => {
    const p = item.product;
    const roleLabel =
      idx === 0
        ? 'Pilihan Utama Paling Relevan'
        : idx === 1
          ? 'Alternatif Hemat / Praktis'
          : 'Pelengkap Solusi';
    const matchedText =
      item.matchedProblems.length > 0
        ? `Cocok untuk masalah "${item.matchedProblems.join(', ')}": `
        : '';

    return {
      id: p.id,
      name: p.name,
      category: p.category,
      priceRange: formatPriceRange(p.price_min, p.price_max),
      priceMin: p.price_min,
      priceMax: p.price_max,
      rating: p.rating,
      salesCount: p.sales_count,
      imageUrl: p.image_url,
      reason: `[${roleLabel}] ${matchedText}${p.solution_summary}`,
      tradeoffs: p.tradeoffs,
      problemTags: p.problem_tags,
      updatedAt: p.source_updated_at || p.updated_at,
      redirectPath: `/go/${encodeURIComponent(p.id)}`,
      affiliateUrl: p.affiliate_url
    };
  });

  const combinedTradeoffs = ranked
    .map((r, i) => `${i + 1}. ${r.product.name}: ${r.product.tradeoffs}`)
    .join('\n');

  const answerText = [
    `1. Kebutuhan yang Dipahami: ${understoodNeed.replace(/\*\*/g, '')}`,
    `2. Rekomendasi (${productsOut.length} pilihan dari katalog tervalidasi):`,
    ...productsOut.map((p, idx) => `   - Pilihan ${idx + 1}: ${p.name} (${p.priceRange}) — ${p.reason}`),
    `3. Catatan Risiko & Hal yang Perlu Diperiksa:\n${combinedTradeoffs}`,
    `4. Harga & stok dapat berubah sewaktu-waktu. Klik "Lihat detail di marketplace" pada kartu produk untuk memeriksa ukuran dan ulasan terbaru.`
  ].join('\n\n');

  return {
    status: 200,
    body: {
      understoodNeed: understoodNeed.replace(/\*\*/g, ''),
      answer: answerText,
      tradeoffsWarning: combinedTradeoffs,
      products: productsOut,
      disclosure: DEFAULT_DISCLOSURE,
      topic: topTopic
    }
  };
}

export function resolveSafeAffiliateRedirect(catalog, productId) {
  if (!productId || typeof productId !== 'string') {
    return { ok: false, status: 400, error: 'Product ID wajib diisi.' };
  }
  // Cegah percobaan open redirect bila seseorang mengirim URL penuh di parameter
  if (/^https?:\/\//i.test(productId) || productId.includes('//') || productId.includes('..')) {
    return { ok: false, status: 400, error: 'Open redirect tidak diizinkan.' };
  }

  const found = catalog.find((p) => p.id === productId && p.status === 'published');
  if (!found) {
    return { ok: false, status: 404, error: 'Produk tidak ditemukan atau belum dipublikasikan.' };
  }

  const isAllowedAffiliateHost = /^https:\/\/(s\.shopee\.co\.id|tokopedia\.link)\//i.test(found.affiliate_url);
  if (!isAllowedAffiliateHost) {
    return { ok: false, status: 500, error: 'Tautan afiliasi produk tidak lolos verifikasi domain resmi.' };
  }

  return {
    ok: true,
    status: 302,
    productId: found.id,
    location: found.affiliate_url
  };
}

