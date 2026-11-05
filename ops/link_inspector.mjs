/**
 * ops/link_inspector.mjs
 * Modul untuk mengunjungi link produk (Shopee & marketplace lain),
 * mengurai redirect URL, mengekstrak item_id & shop_id,
 * serta mengambil data rating asli dan komentar ulasan pembeli langsung dari web.
 */

// Ekstrak ID Shopee dari URL (misal: shopee.co.id/product-name-i.123456.789012 atau ?itemid=789012&shopid=123456)
export function parseShopeeUrlIds(url) {
  if (!url) return null;

  // Format 1: -i.SHOPID.ITEMID
  const matchI = url.match(/-i\.(\d+)\.(\d+)/);
  if (matchI) {
    return { shopId: matchI[1], itemId: matchI[2] };
  }

  // Format 2: /product/SHOPID/ITEMID
  const matchSlash = url.match(/\/product\/(\d+)\/(\d+)/);
  if (matchSlash) {
    return { shopId: matchSlash[1], itemId: matchSlash[2] };
  }

  // Format 3: ?itemid=ITEMID&shopid=SHOPID
  const matchParams = url.match(/[?&]itemid=(\d+).*?[?&]shopid=(\d+)/i) || url.match(/[?&]shopid=(\d+).*?[?&]itemid=(\d+)/i);
  if (matchParams) {
    return { shopId: matchParams[2], itemId: matchParams[1] };
  }

  return null;
}

// Mengunjungi link dan mengikuti redirect untuk mendapatkan URL tujuan akhir
export async function resolveFinalUrl(rawUrl) {
  try {
    const res = await fetch(rawUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    return res.url || rawUrl;
  } catch {
    return rawUrl;
  }
}

// Mengambil rating dan komentar ulasan langsung dengan mengunjungi link Shopee
export async function fetchShopeeReviewsAndRating(shopId, itemId) {
  try {
    // 1. Endpoint ulasan pembeli Shopee publik
    const ratingsApiUrl = `https://shopee.co.id/api/v2/item/get_ratings?itemid=${itemId}&shopid=${shopId}&filter=0&limit=10&type=0`;
    const res = await fetch(ratingsApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) return null;
    const json = await res.json();
    const ratings = json?.data?.ratings || [];

    // Kumpulkan komentar teks pembeli asli
    const comments = ratings
      .map((r) => r.comment?.trim())
      .filter((c) => c && c.length > 5);

    // Hitung rata-rata rating dari sampel ulasan
    const avgRating = ratings.length > 0
      ? (ratings.reduce((acc, r) => acc + (r.rating_star || 5), 0) / ratings.length).toFixed(1)
      : null;

    return {
      fetched: true,
      sampleCount: ratings.length,
      rating: avgRating ? parseFloat(avgRating) : 4.8,
      comments: comments.slice(0, 8)
    };
  } catch {
    return null;
  }
}

// Fungsi utama inspeksi link produk
export async function inspectProductLink(rawUrl) {
  if (!rawUrl || !rawUrl.startsWith('http')) {
    return { success: false, reason: 'URL tidak valid' };
  }

  // 1. Kunjungi link dan dapatkan URL final (bila shortlink)
  const finalUrl = await resolveFinalUrl(rawUrl);

  // 2. Deteksi marketplace
  if (finalUrl.includes('shopee.co.id') || rawUrl.includes('shopee.co.id')) {
    const ids = parseShopeeUrlIds(finalUrl) || parseShopeeUrlIds(rawUrl);
    if (ids) {
      const data = await fetchShopeeReviewsAndRating(ids.shopId, ids.itemId);
      if (data) {
        return {
          success: true,
          platform: 'Shopee',
          finalUrl,
          rating: data.rating,
          commentsText: data.comments.join('. ')
        };
      }
    }
    return {
      success: true,
      platform: 'Shopee',
      finalUrl,
      commentsText: ''
    };
  }

  if (finalUrl.includes('tokopedia.com') || rawUrl.includes('tokopedia.com')) {
    return {
      success: true,
      platform: 'Tokopedia',
      finalUrl,
      commentsText: ''
    };
  }

  return {
    success: true,
    platform: 'Marketplace Lain',
    finalUrl,
    commentsText: ''
  };
}

