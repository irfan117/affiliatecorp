/**
 * worker/src/index.ts
 * Cloudflare Worker API — AI Sales Assistant untuk Pengunjung Iklan Sosmed
 * Persona: Rian Pratama (Pemilik Toko)
 *
 * Fitur Keamanan & Bot Protection:
 *  - Multi-tier Sliding Window Rate Limiter (Burst 5 detik + Kuota 1 Menit)
 *  - Honeypot Trap Detector (menangkap bot spam yang otomatis mengisi input tersembunyi)
 *  - Scraper / Automated User-Agent Blocker
 *  - Cloudflare Threat Score Inspection (CF-Threat-Score)
 *  - Prompt Injection & Payload Flood Guard (Max 500 karakter)
 *
 * Integrasi AI Wajib:
 *  - Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct) bawaan edge tanpa biaya
 *  - Google Gemini API / OpenAI API via env.AI_API_KEY
 *  - Intelligent Rule-Based Fallback jika AI offline atau testing
 */
import {
  findProductById,
  generateSalesResponse,
  getRecommendedProducts,
  AFFILIATE_DISCLOSURE
} from './salesEngine.mjs';

export interface Env {
  DB?: any;
  AI?: any;
  AI_API_KEY?: string;
  HASH_SALT?: string;
  RATE_LIMIT_PER_MINUTE?: string;
  BURST_LIMIT_PER_5_SEC?: string;
  AFFILIATE_DISCLOSURE?: string;
}

interface RateBucket {
  count1m: number;
  reset1m: number;
  countBurst: number;
  resetBurst: number;
}

const ipBuckets = new Map<string, RateBucket>();

function cleanOldBuckets(now: number) {
  if (ipBuckets.size > 5000) {
    for (const [ip, b] of ipBuckets.entries()) {
      if (now > b.reset1m) ipBuckets.delete(ip);
    }
  }
}

interface SecurityCheckResult {
  allowed: boolean;
  statusCode?: number;
  message?: string;
  retryAfterSeconds?: number;
}

function verifyRequestSecurity(
  request: Request,
  payload: any,
  limitPerMin = 10,
  burstLimit = 3
): SecurityCheckResult {
  const now = Date.now();
  cleanOldBuckets(now);

  // 1. Cek Cloudflare Threat Score
  const threatScore = parseInt(request.headers.get('CF-Threat-Score') || '0', 10);
  if (threatScore > 25) {
    return {
      allowed: false,
      statusCode: 403,
      message: 'Akses ditolak: IP terindikasi aktivitas mencurigakan atau bot berbahaya.'
    };
  }

  // 2. Anti-Honeypot Trap: jika bot mengisi field jebakan
  if (payload && (payload.website || payload.company || payload._hp || payload.email_trap)) {
    return {
      allowed: false,
      statusCode: 400,
      message: 'Spam bot terdeteksi melalui honeypot trap.'
    };
  }

  // 3. User-Agent Scraper Check untuk request POST
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();
  const knownScrapers = ['curl', 'python-requests', 'scrapy', 'aiohttp', 'wget', 'go-http-client', 'httpclient'];
  if (!ua || knownScrapers.some((bot) => ua.startsWith(bot))) {
    return {
      allowed: false,
      statusCode: 403,
      message: 'Automated scraper bot tidak diizinkan mengakses konsultasi AI.'
    };
  }

  // 4. Rate Limiter IP: Burst (5s) + Kuota Per Menit
  const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  let bucket = ipBuckets.get(clientIp);

  if (!bucket || now > bucket.reset1m) {
    bucket = {
      count1m: 1,
      reset1m: now + 60_000,
      countBurst: 1,
      resetBurst: now + 5_000
    };
    ipBuckets.set(clientIp, bucket);
    return { allowed: true };
  }

  // Cek Burst Limit (maksimal 3 request per 5 detik untuk stop bot spam klik)
  if (now > bucket.resetBurst) {
    bucket.countBurst = 1;
    bucket.resetBurst = now + 5_000;
  } else {
    bucket.countBurst += 1;
    if (bucket.countBurst > burstLimit) {
      return {
        allowed: false,
        statusCode: 429,
        message: 'Ketiknya santai saja ya kak. Tunggu beberapa detik sebelum bertanya lagi.',
        retryAfterSeconds: 5
      };
    }
  }

  // Cek Kuota Per Menit
  bucket.count1m += 1;
  if (bucket.count1m > limitPerMin) {
    const remainingSeconds = Math.ceil((bucket.reset1m - now) / 1000);
    return {
      allowed: false,
      statusCode: 429,
      message: `Batas pesan tercapai (${limitPerMin} pesan/menit). Mohon jeda ${remainingSeconds} detik ya kak agar server tidak overload.`,
      retryAfterSeconds: remainingSeconds
    };
  }

  return { allowed: true };
}

async function generateAiSalesResponse(
  product: any,
  question: string,
  env: Env,
  catalog: any[] = []
): Promise<{ text: string | null; error?: string; raw?: any }> {
  // A. Cloudflare Workers AI (@cf/zai-org/glm-4.7-flash)
  if (env.AI && typeof env.AI.run === 'function') {
    try {
      const recs = getRecommendedProducts(catalog, product, 3);
      const recsListText = recs.length > 0
        ? recs.map((r: any) => `- ${r.name} (${r.price_promo})`).join('\n')
        : 'Tidak ada produk tambahan khusus.';

      const systemPrompt = `Kamu adalah Rian Pratama, asisten toko online yang ramah, sopan, dan to-the-point membantu calon pembeli.
Produk yang sedang dilihat pembeli: "${product.name}".

Data produk resmi:
- Harga Promo: ${product.price_promo} (Harga Asli: ${product.price_original})
- Rating & Penjual: ${product.rating}/5.0 (${product.sales_count}+ terjual di ${product.marketplace_name})
- Spesifikasi Produk: ${JSON.stringify(product.specs || {})}
- Poin Keunggulan: ${(product.sales_points || []).join('; ')}
- Jaminan Toko: ${product.free_shipping_badge || 'Gratis Ongkir & Garansi Retur Resmi'}

Produk lain yang benar-benar tersedia di toko ini (untuk rekomendasi):
${recsListText}

PANDUAN MENJAWAB (PENTING):
1. FOKUS KE KEBUTUHAN PEMBELI: Pembeli tidak butuh mendengar kamu mengkurasi atau "sudah tes sendiri". Jawablah langsung secara relevan, ramah, dan solutif tanpa membanggakan diri.
2. JANGAN MENGARANG PRODUK: Jika pembeli bertanya produk lain atau rekomendasi, HANYA sebutkan dari daftar "Produk lain yang benar-benar tersedia di toko ini" di atas. Jangan mengarang produk fiktif!
3. JAWAB SESUAI PERTANYAAN:
   - Jika ditanya "siapkan pesanan", "mau beli", "checkout", "order", atau "cara beli" -> Berikan panduan checkout ramah: arahkan pembeli untuk langsung klik tombol "Beli Sekarang di ${product.marketplace_name}" atau link pada kartu produk di chat untuk klaim promo harga ${product.price_promo} dan fasilitas ${product.free_shipping_badge}.
   - Jika ditanya "apa itu", "fungsinya apa", atau "jelaskan" -> Jelaskan produk secara langsung dan ringkas: kegunaan utamanya, fungsinya memecahkan masalah apa, tanpa basa-basi atau membanggakan diri.
   - Jika ditanya rekomendasi/produk lain -> sebutkan produk pendamping di atas dan kenapa cocok dipadukan. JANGAN jawab "Muat banget kak!".
   - Jika ditanya ukuran/kapasitas -> jawab ukuran dan kecocokannya secara langsung.
   - Jika ditanya bahan/kualitas -> jawab material dan ketahanannya.
4. NADA BICARA: Santai, ramah, dan manusiawi (panggil "kak" atau "kakak"), maksimal 2-3 kalimat padat agar nyaman dibaca di layar HP. Jangan pernah mengarang nomor WhatsApp atau link luar.`;

      const aiResult: any = await env.AI.run('@cf/zai-org/glm-4.7-flash', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 350,
        chat_template_kwargs: {
          enable_thinking: false
        },
        temperature: 0.7
      });

      const choiceMsg = aiResult?.choices?.[0]?.message;
      let text =
        choiceMsg?.content ||
        aiResult?.response ||
        (typeof aiResult === 'string' ? aiResult : null);

      if (text) {
        return { text: String(text).trim(), raw: aiResult };
      }
      return { text: null, raw: aiResult };
    } catch (err: any) {
      console.warn('Workers AI (@cf/zai-org/glm-4.7-flash) error:', err.message);
      return { text: null, error: err.message };
    }
  }

  // B. Google Gemini API / External LLM (Jika env.AI_API_KEY dikonfigurasi)
  if (env.AI_API_KEY) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.AI_API_KEY}`;
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Kamu adalah Rian Pratama, pemilik toko terpercaya. Jawab pertanyaan pembeli "${question}" tentang produk "${product.name}" berdasarkan fakta: ${JSON.stringify(product)}. Gunakan bahasa Indonesia santai, panggil "kak", maksimal 3 kalimat.`
                }
              ]
            }
          ]
        })
      });
      if (res.ok) {
        const data: any = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text: text.trim() };
      }
    } catch (err: any) {
      console.warn('Gemini API gagal, beralih ke fallback engine:', err.message);
      return { text: null, error: err.message };
    }
  }

  return { text: null };
}

async function sha256Short(input: string, salt = 'sales-anon-salt'): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${input}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const isAllowedOrigin =
      !origin ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.pages.dev') ||
      origin.includes('pages.dev') ||
      origin.includes('afiliatcorp');

    const allowedOrigin = isAllowedOrigin ? (origin || '*') : '*';

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Max-Age': '86400',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
      const limitPerMin = parseInt(env.RATE_LIMIT_PER_MINUTE || '10', 10);
      const burstLimit = parseInt(env.BURST_LIMIT_PER_5_SEC || '3', 10);

      // Ambil katalog dari D1 jika binding DB tersedia
      let catalog: any[] = [];
      if (env.DB) {
        try {
          const rows = await env.DB.prepare(
            `SELECT * FROM products WHERE status = 'published'`
          ).all();
          catalog = (rows.results || []).map((r: any) => ({
            ...r,
            headline: r.headline || r.solution_summary || r.name || '',
            solution_summary: r.solution_summary || r.headline || r.name || '',
            price_promo: r.price_promo || (r.price_min ? ('Rp' + Number(r.price_min).toLocaleString('id-ID')) : 'Rp95.000'),
            price_original: r.price_original || (r.price_max ? ('Rp' + Number(r.price_max).toLocaleString('id-ID')) : ''),
            discount_tag: r.discount_tag || 'Promo Spesial',
            marketplace_name: r.marketplace_name || (r.affiliate_url && r.affiliate_url.includes('tokopedia') ? 'Tokopedia Official' : (r.affiliate_url && r.affiliate_url.includes('shopee') ? 'Shopee Official' : 'Official Store')),
            free_shipping_badge: r.free_shipping_badge || 'Gratis Ongkir',
            specs: typeof r.specs === 'string' ? JSON.parse(r.specs) : (r.specs || {}),
            sales_points: typeof r.sales_points === 'string' ? JSON.parse(r.sales_points) : (Array.isArray(r.sales_points) ? r.sales_points : (r.solution_summary ? [r.solution_summary] : [])),
            faq: typeof r.faq === 'string' ? JSON.parse(r.faq) : (Array.isArray(r.faq) ? r.faq : [])
          }));
        } catch {
          catalog = [];
        }
      }

      // Test Workers AI Endpoint
      if (url.pathname === '/api/test-ai') {
        try {
          if (!env.AI || typeof env.AI.run !== 'function') {
            return new Response(JSON.stringify({ error: 'env.AI is not bound', envKeys: Object.keys(env) }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          const aiTest: any = await env.AI.run('@cf/zai-org/glm-4.7-flash', {
            messages: [{ role: 'user', content: 'Katakan halo dalam bahasa Indonesia' }],
            max_tokens: 150,
            chat_template_kwargs: {
              enable_thinking: false
            }
          });
          return new Response(JSON.stringify({ success: true, model: '@cf/zai-org/glm-4.7-flash', result: aiTest }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // 1. POST /api/sales-chat (AI Sales Konsultasi Produk dengan Bot Protection)
      if (url.pathname === '/api/sales-chat' && request.method === 'POST') {
        let payload: any = {};
        try {
          payload = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: 'Format JSON tidak valid.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Validasi Panjang Pertanyaan (Max 500 karakter)
        const rawQuestion = String(payload.question || '').trim();
        if (rawQuestion.length > 500) {
          return new Response(
            JSON.stringify({
              error: 'Pertanyaan terlalu panjang (maksimal 500 karakter).',
              answer: 'Pertanyaan kakak terlalu panjang. Bisa diringkas poin utamanya ya kak?'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Evaluasi Keamanan & Rate Limit
        const secCheck = verifyRequestSecurity(request, payload, limitPerMin, burstLimit);
        if (!secCheck.allowed) {
          const respHeaders: Record<string, string> = {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(limitPerMin)
          };
          if (secCheck.retryAfterSeconds) {
            respHeaders['Retry-After'] = String(secCheck.retryAfterSeconds);
          }
          return new Response(
            JSON.stringify({
              error: secCheck.message,
              answer: secCheck.message
            }),
            { status: secCheck.statusCode || 429, headers: respHeaders }
          );
        }

        const product = findProductById(catalog, payload.productId);
        const salesResult = generateSalesResponse(product, rawQuestion, catalog);

        // Jalankan AI Jika Produk Ditemukan
        if (product && salesResult.status === 200) {
          const aiRes = await generateAiSalesResponse(product, rawQuestion, env, catalog);
          if (aiRes.text) {
            salesResult.body.answer = aiRes.text;
            salesResult.body.ai_engine = '@cf/zai-org/glm-4.7-flash';
          } else if (aiRes.error) {
            salesResult.body.ai_error = aiRes.error;
          }
        }

        // Log ke D1 Analytics
        if (env.DB && salesResult.status === 200) {
          const sessionHash = await sha256Short(payload.sessionId || clientIp, env.HASH_SALT);
          const queryHash = await sha256Short(rawQuestion, env.HASH_SALT);
          await env.DB.prepare(
            `INSERT INTO query_events (id, session_hash, query_hash, topic, created_at) VALUES (?, ?, ?, ?, ?)`
          )
            .bind(
              crypto.randomUUID(),
              sessionHash,
              queryHash,
              `sales:${product?.id || 'unknown'}`,
              new Date().toISOString()
            )
            .run()
            .catch(() => {});
        }

        return new Response(JSON.stringify(salesResult.body), {
          status: salesResult.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(limitPerMin)
          }
        });
      }

      // 2. GET /go/:productId (Safe Affiliate Redirect + Click Logging)
      if (url.pathname.startsWith('/go/') && request.method === 'GET') {
        const productId = decodeURIComponent(url.pathname.slice('/go/'.length)).trim();
        const product = findProductById(catalog, productId);

        if (!product || !product.affiliate_url) {
          return new Response(
            JSON.stringify({ error: 'Produk tidak ditemukan atau link belum tersedia.' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (env.DB) {
          const sessionHash = await sha256Short(clientIp, env.HASH_SALT);
          const referrer = request.headers.get('Referer') || 'ads_social_media';
          await env.DB.prepare(
            `INSERT INTO click_events (id, product_id, session_hash, referrer, created_at) VALUES (?, ?, ?, ?, ?)`
          )
            .bind(
              crypto.randomUUID(),
              product.id,
              sessionHash,
              referrer.slice(0, 120),
              new Date().toISOString()
            )
            .run()
            .catch(() => {});
        }

        return Response.redirect(product.affiliate_url, 302);
      }

      return new Response(JSON.stringify({ message: 'AfiliatCorp AI Sales API Active & Protected' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (globalErr: any) {
      console.error('Unhandled Worker Exception:', globalErr);
      return new Response(
        JSON.stringify({
          error: 'Terjadi gangguan sementara pada server.',
          detail: globalErr?.message || 'Internal server error'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }
};
