/**
 * ops/shopee_api.mjs
 * Modul Integrasi Resmi Shopee Affiliate Open API (GraphQL)
 * Dokumentasi: https://affiliate.shopee.co.id/open_api/home
 * 
 * Fitur:
 * 1. generateShortLink: Mengubah link produk Shopee biasa menjadi link affiliate resmi akun Anda secara otomatis.
 * 2. searchProductOffers: Mencari produk rekomendasi Shopee dengan komisi tertinggi, rating tinggi, & volume penjualan.
 */

import crypto from 'node:crypto';

export class ShopeeAffiliateClient {
  constructor(appId, secret) {
    this.appId = appId || process.env.SHOPEE_APP_ID || '';
    this.secret = secret || process.env.SHOPEE_APP_SECRET || '';
    this.endpoint = 'https://open-api.affiliate.shopee.co.id/graphql';
  }

  isConfigured() {
    return Boolean(this.appId && this.secret);
  }

  /**
   * Menghasilkan signature SHA256 resmi sesuai standar Shopee Open API:
   * factor = appId + timestamp + payload + secret
   * signature = sha256(factor)
   */
  generateAuthHeaders(payloadString) {
    const timestamp = Math.floor(Date.now() / 1000);
    const factor = `${this.appId}${timestamp}${payloadString}${this.secret}`;
    const signature = crypto.createHash('sha256').update(factor).digest('hex');

    return {
      'Content-Type': 'application/json',
      'Authorization': `SHA256 Credential=${this.appId}, Timestamp=${timestamp}, Signature=${signature}`
    };
  }

  async executeQuery(query, variables = {}) {
    if (!this.isConfigured()) {
      throw new Error('Shopee App ID dan Secret belum dikonfigurasi. Dapatkan di https://affiliate.shopee.co.id/open_api/home');
    }

    const payload = JSON.stringify({ query, variables });
    const headers = this.generateAuthHeaders(payload);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: payload
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Shopee Open API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    if (data.errors && data.errors.length > 0) {
      throw new Error(`Shopee GraphQL Error: ${data.errors[0].message}`);
    }

    return data.data;
  }

  /**
   * 1. Otomatis mengubah URL produk biasa menjadi Link Affiliate akun Anda
   * Contoh: 'https://shopee.co.id/product/123/456' -> 'https://s.shopee.co.id/xxxx'
   */
  async generateShortLink(originUrl, subIds = ['temanbelanja_ads']) {
    const query = `
      mutation GenerateLink($originUrl: String!, $subIds: [String!]) {
        generateShortLink(input: { originUrl: $originUrl, subIds: $subIds }) {
          shortLink
        }
      }
    `;

    const result = await this.executeQuery(query, { originUrl, subIds });
    return result?.generateShortLink?.shortLink || null;
  }

  /**
   * 2. Mencari Produk Shopee dengan komisi tertinggi & rating terbaik
   */
  async searchProductOffers(keyword, page = 1, limit = 10) {
    const query = `
      query SearchProducts($keyword: String, $page: Int, $limit: Int) {
        productOfferV2(keyword: $keyword, page: $page, limit: $limit, sortType: 1) {
          nodes {
            itemId
            shopId
            productName
            imageUrl
            priceMin
            priceMax
            commissionRate
            commission
            sales
            ratingStar
            offerLink
          }
        }
      }
    `;

    const result = await this.executeQuery(query, { keyword, page, limit });
    return result?.productOfferV2?.nodes || [];
  }
}

