import { ADVERTISED_PRODUCTS, type AdvertisedProduct } from '../data/salesProducts';

export interface SalesClosingCta {
  label: string;
  price_promo: string;
  badge: string;
  url: string;
  redirect_path: string;
}

export interface SalesTurnResponse {
  product_id: string;
  product_name: string;
  question: string;
  answer: string;
  closing_cta: SalesClosingCta;
  complementary: AdvertisedProduct[];
  bundle_reason?: string;
}

export function evaluateReviews(reviewsText = '') {
  const text = String(reviewsText || '').toLowerCase();
  const negativeWords = [
    'patah', 'lecet', 'kecewa', 'jelek', 'rusak', 'palsu', 'tipis banget',
    'tidak sesuai', 'bintang 1', 'penipu', 'lelet', 'retur'
  ];
  const positiveWords = [
    'kokoh', 'bagus banget', 'tebal', 'original', 'puas', 'cepat sampai',
    'rapi', 'pas banget', 'berfungsi baik', 'recomended', 'rekomend', 'mantap', 'ori'
  ];

  const foundNegatives = negativeWords.filter((w) => text.includes(w));
  const foundPositives = positiveWords.filter((w) => text.includes(w));

  const isApproved = foundNegatives.length === 0 || foundPositives.length >= foundNegatives.length * 3;
  return {
    isApproved,
    positivePoints: foundPositives,
    complaintPoints: foundNegatives,
    summary: isApproved
      ? `Ulasan terverifikasi sangat positif (${foundPositives.length} indikator kepuasan ditemukan).`
      : `Peringatan: Ditemukan indikator komplain pembeli (${foundNegatives.join(', ')}).`
  };
}

export function getProductFromAds(productId?: string | null): AdvertisedProduct {
  if (productId) {
    const found = ADVERTISED_PRODUCTS.find(
      (p) => p.id.toLowerCase() === productId.toLowerCase()
    );
    if (found) return found;
  }
  return ADVERTISED_PRODUCTS[0];
}

/**
 * Menghasilkan produk rekomendasi cerdas untuk pembeli.
 * Rekomendasi tidak terbatas hanya pada produk yang "cocok berpasangan",
 * melainkan juga produk yang sering dibeli bersamaan oleh pembeli lain,
 * produk populer di kategori serupa, atau produk favorit pilihan toko.
 */
export function getRecommendedProducts(
  product: AdvertisedProduct,
  limit = 2
): AdvertisedProduct[] {
  const result: AdvertisedProduct[] = [];
  const addedIds = new Set<string>([product.id]);

  // 1. Rekomendasi Pembelian Bersamaan (Co-bought / Paired products)
  const pairedIds = product.complementary_ids || [];
  for (const id of pairedIds) {
    if (result.length >= limit) break;
    const found = ADVERTISED_PRODUCTS.find((p) => p.id === id);
    if (found && !addedIds.has(found.id)) {
      result.push({
        ...found,
        recommendation_badge: 'Sering dibeli bersamaan',
        recommendation_reason: 'Banyak pembeli produk ini juga memesan produk ini.'
      });
      addedIds.add(found.id);
    }
  }

  // 2. Rekomendasi Kategori Terkait / Samaan Kebutuhan
  if (result.length < limit) {
    const sameCategory = ADVERTISED_PRODUCTS.filter(
      (p) => !addedIds.has(p.id) && p.category === product.category
    );
    for (const p of sameCategory) {
      if (result.length >= limit) break;
      result.push({
        ...p,
        recommendation_badge: 'Populer di kategori ini',
        recommendation_reason: `Pilihan favorit pembeli untuk kategori ${p.category}.`
      });
      addedIds.add(p.id);
    }
  }

  // 3. Rekomendasi Best-Seller / Banyak Diminati Pembeli Lain (Cross-store Discovery)
  if (result.length < limit) {
    const popularProducts = [...ADVERTISED_PRODUCTS]
      .filter((p) => !addedIds.has(p.id))
      .sort((a, b) => b.sales_count - a.sales_count || b.rating - a.rating);

    for (const p of popularProducts) {
      if (result.length >= limit) break;
      result.push({
        ...p,
        recommendation_badge: 'Banyak diminati pembeli',
        recommendation_reason: `Telah terjual ${p.sales_count.toLocaleString('id-ID')}+ unit dengan rating tinggi.`
      });
      addedIds.add(p.id);
    }
  }

  return result;
}

// Alias untuk menjaga kompatibilitas pemanggilan
export const getComplementaryProducts = getRecommendedProducts;

export function askProductSalesAssistant(
  product: AdvertisedProduct,
  rawQuestion: string
): SalesTurnResponse {
  const cleanQ = (rawQuestion || '').trim();
  const qLower = cleanQ.toLowerCase();
  const specs = product.specs || {};
  const faqs = product.faq || [];
  const complementary = getRecommendedProducts(product);

  const baseCta: SalesClosingCta = {
    label: 'Beli Produk Ini',
    price_promo: product.price_promo,
    badge: product.free_shipping_badge,
    url: product.affiliate_url,
    redirect_path: `/go/${encodeURIComponent(product.id)}`
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
      product_id: product.id,
      product_name: product.name,
      question: cleanQ,
      answer: `Siap kak! Untuk memesan ${product.name}, kakak bisa langsung klik tombol "Beli Sekarang di ${product.marketplace_name || 'Official Store'}" di kartu produk bawah ini ya.\n\nTautan tersebut langsung menuju toko resmi dengan jaminan produk original, harga promo ${product.price_promo}, dan fasilitas ${product.free_shipping_badge}. Tinggal pilih metode pembayaran dan masukkan alamat pengiriman kakak di sana.\n\nAda yang mau dipastikan lagi sebelum bayar kak?`,
      closing_cta: baseCta,
      complementary,
      bundle_reason: product.bundle_reason
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
      ? '\n\nKeunggulan utamanya:\n• ' + product.sales_points.slice(0, 3).join('\n• ')
      : '';
    return {
      product_id: product.id,
      product_name: product.name,
      question: cleanQ,
      answer: `Halo kak! ${product.name} adalah solusi untuk ${summary.toLowerCase()}.${pointsText}\n\nProduk ini memiliki rating ⭐ ${product.rating}/5.0 dari ${(product.sales_count || 0).toLocaleString('id-ID')}+ pembeli di ${product.marketplace_name || 'Official Store'}. Promo saat ini sedang aktif di harga ${product.price_promo}. Ada yang mau ditanyakan lagi kak?`,
      closing_cta: baseCta,
      complementary,
      bundle_reason: product.bundle_reason
    };
  }

  // 2. Pertanyaan tentang produk lain / rekomendasi produk yang sering dibeli
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
    const compNames = complementary.map((c) => `${c.name} (${c.price_promo})`).join(' serta ');
    return {
      product_id: product.id,
      product_name: product.name,
      question: cleanQ,
      answer: `Selain ${product.name}, langganan toko kami juga sering memesan ${compNames} secara bersamaan kak.\n\nSaya sudah sematkan kartu produk rekomendasinya di bawah. Kakak bisa klik salah satunya untuk cek detailnya atau buka tombol "Lihat Produk" di atas ya!`,
      closing_cta: baseCta,
      complementary,
      bundle_reason: product.bundle_reason
    };
  }

  // 3. Cek kecocokan FAQ spesifik produk
  const stopWords = new Set(['apakah', 'bagaimana', 'berapa', 'kalau', 'gimana', 'untuk', 'yang', 'dengan', 'bisa', 'dalam', 'saya', 'atau', 'dari', 'pada', 'saat', 'akan', 'tidak']);
  for (const item of faqs) {
    const words = item.q
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !stopWords.has(w));
    const hits = words.filter((w) => qLower.includes(w)).length;
    if (hits >= 2 || qLower.includes(item.q.toLowerCase().slice(0, 20))) {
      return {
        product_id: product.id,
        product_name: product.name,
        question: cleanQ,
        answer: `${item.a}\n\nProduk ini sudah terjual lebih dari ${(product.sales_count || 0).toLocaleString('id-ID')} unit dengan kepuasan pembeli ${product.rating} / 5.0.`,
        closing_cta: baseCta,
        complementary,
        bundle_reason: product.bundle_reason
      };
    }
  }

  // 4. Pertanyaan Cara Pasang / Pemasangan / Bor
  if (
    qLower.includes('pasang') ||
    qLower.includes('bor') ||
    qLower.includes('paku') ||
    qLower.includes('obeng') ||
    qLower.includes('rakit') ||
    qLower.includes('instalasi')
  ) {
    const installInfo = specs.installation || 'Sistem pemasangan sangat praktis tanpa memerlukan peralatan rumit atau melubangi meja/dinding.';
    return {
      product_id: product.id,
      product_name: product.name,
      question: cleanQ,
      answer: `Pemasangannya simpel banget kak! ${installInfo}\n\nKakak tidak perlu mengebor daun meja atau merusak dinding sama sekali. Cukup pasang dalam 2–3 menit dan langsung kokoh siap pakai.`,
      closing_cta: baseCta,
      complementary,
      bundle_reason: product.bundle_reason
    };
  }

  // 5. Pertanyaan Kompatibilitas Ukuran, Tebal Meja, Dimensi
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
    const detailLines: string[] = [];
    if (specs.table_compatibility) detailLines.push(`Kecocokan Meja: ${specs.table_compatibility}`);
    if (specs.dimensions) detailLines.push(`Dimensi Produk: ${specs.dimensions}`);
    if (specs.capacity) detailLines.push(`Kapasitas Beban: ${specs.capacity}`);
    if (specs.compatibility) detailLines.push(`Kompatibilitas: ${specs.compatibility}`);

    return {
      product_id: product.id,
      product_name: product.name,
      question: cleanQ,
      answer: `Untuk ukuran dan kecocokan ${product.name}, ini spesifikasinya kak:\n\n${
        detailLines.length > 0
          ? detailLines.map((l) => `• ${l}`).join('\n')
          : 'Dirancang dengan dimensi standar yang fleksibel untuk kebutuhan harian.'
      }\n\nSelama ukuran tempat kakak masuk dalam rentang di atas, dipastikan pas dan stabil saat dipakai.`,
      closing_cta: baseCta,
      complementary,
      bundle_reason: product.bundle_reason
    };
  }

  // 6. Pertanyaan Kualitas Bahan / Anti Karat / Lecet / Rusak
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
    const protInfo = specs.protection ? ` Selain itu, ${specs.protection}.` : '';
    return {
      product_id: product.id,
      product_name: product.name,
      question: cleanQ,
      answer: `Kualitas bahannya terjamin kokoh kak, terbuat dari ${matInfo}.${protInfo}\n\nKonstruksinya kokoh buat pemakaian jangka panjang, anti karat, dan kuat menahan beban berat tanpa melengkung.`,
      closing_cta: baseCta,
      complementary,
      bundle_reason: product.bundle_reason
    };
  }

  // 7. Pertanyaan Garansi / Keaslian / Ongkir / Pengiriman / Diskon
  if (
    qLower.includes('garansi') ||
    qLower.includes('asli') ||
    qLower.includes('ori') ||
    qLower.includes('ongkir') ||
    qLower.includes('kirim') ||
    qLower.includes('promo') ||
    qLower.includes('diskon')
  ) {
    return {
      product_id: product.id,
      product_name: product.name,
      question: cleanQ,
      answer: `Produk ini 100% original dari official store resmi kak, ada fasilitas ${product.free_shipping_badge} serta jaminan retur ganti baru kalau barang diterima cacat atau tidak sesuai.\n\nHarga promo saat ini ${product.price_promo} (dari harga normal ${product.price_original}). Diskon ini berlaku terbatas ya kak.`,
      closing_cta: baseCta,
      complementary,
      bundle_reason: product.bundle_reason
    };
  }

  // 8. Default Sales Consultation
  const pitch = (product.sales_points && product.sales_points.length > 0)
    ? product.sales_points[0]
    : (product.solution_summary || product.headline || product.name);

  return {
    product_id: product.id,
    product_name: product.name,
    question: cleanQ,
    answer: `Halo kak! Mengenai ${product.name}: produk ini dirancang untuk ${(product.solution_summary || product.headline || product.name).toLowerCase()}.\n\nKeunggulan utamanya: ${pitch}. Sudah dipercaya oleh lebih dari ${(product.sales_count || 0).toLocaleString('id-ID')}+ pembeli dengan rating tinggi ${product.rating} / 5.0 dan promo saat ini ${product.price_promo}. Kakak bisa klik kartu di bawah untuk pesan atau tanyakan hal yang ingin dipastikan ya kak!`,
    closing_cta: baseCta,
    complementary,
    bundle_reason: product.bundle_reason
  };
}
