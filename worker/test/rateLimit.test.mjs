import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';

test('1. Menolak spam bot melalui Honeypot Trap', async () => {
  const req = new Request('http://localhost/api/sales-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    body: JSON.stringify({
      productId: 'tray-kabel-jepit',
      question: 'Halo',
      website: 'http://spam-link.com' // Honeypot trap
    })
  });

  const res = await worker.fetch(req, {});
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes('Honeypot') || data.error.includes('honeypot'));
});

test('2. Menolak scraper bot berbasis automated User-Agent (curl / python)', async () => {
  const req = new Request('http://localhost/api/sales-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'python-requests/2.28.1'
    },
    body: JSON.stringify({
      productId: 'tray-kabel-jepit',
      question: 'Halo'
    })
  });

  const res = await worker.fetch(req, {});
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.ok(data.error.includes('bot') || data.error.includes('scraper'));
});

test('3. Menolak pesan di atas 500 karakter untuk mencegah buffer/token flood', async () => {
  const longText = 'a'.repeat(501);
  const req = new Request('http://localhost/api/sales-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    body: JSON.stringify({
      productId: 'tray-kabel-jepit',
      question: longText
    })
  });

  const res = await worker.fetch(req, {});
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes('500 karakter'));
});

test('4. Mencegah spam klik (Burst Rate Limit maksimal 3 request per 5 detik)', async () => {
  const testIp = '192.168.100.99';
  const makeReq = () =>
    new Request('http://localhost/api/sales-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        'CF-Connecting-IP': testIp
      },
      body: JSON.stringify({
        productId: 'tray-kabel-jepit',
        question: 'Apakah produk ini ready kak?'
      })
    });

  // Kirim 3 request berturut-turut (diizinkan)
  const r1 = await worker.fetch(makeReq(), {});
  const r2 = await worker.fetch(makeReq(), {});
  const r3 = await worker.fetch(makeReq(), {});
  assert.equal(r1.status, 200);
  assert.equal(r2.status, 200);
  assert.equal(r3.status, 200);

  // Request ke-4 dalam rentang 5 detik langsung kena Burst Rate Limit (429)
  const r4 = await worker.fetch(makeReq(), {});
  assert.equal(r4.status, 429);
  const data4 = await r4.json();
  assert.ok(data4.answer.includes('santai') || data4.answer.includes('detik'));
});

test('5. Berhasil melayani pertanyaan valid calon pembeli dengan status 200 & tautan closing affiliate', async () => {
  const req = new Request('http://localhost/api/sales-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'CF-Connecting-IP': '10.0.0.88'
    },
    body: JSON.stringify({
      productId: 'tray-kabel-jepit',
      question: 'Meja saya tebal 3,5 cm apakah muat dipasang?'
    })
  });

  const res = await worker.fetch(req, {});
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.product_id, 'tray-kabel-jepit');
  assert.ok(data.answer.length > 20);
  assert.ok(data.closing_cta.url.startsWith('https://'));
});

test('6. Melindungi redirect affiliate: GET /go/:productId mengembalikan 302 ke URL resmi dan menolak ID palsu', async () => {
  // Test valid product redirect
  const reqValid = new Request('http://localhost/go/tray-kabel-jepit', {
    method: 'GET'
  });
  const resValid = await worker.fetch(reqValid, {});
  assert.equal(resValid.status, 302);
  assert.ok(resValid.headers.get('Location')?.startsWith('https://'));

  // Test invalid product redirect
  const reqInvalid = new Request('http://localhost/go/produk-hacker-jahat', {
    method: 'GET'
  });
  const resInvalid = await worker.fetch(reqInvalid, {});
  assert.equal(resInvalid.status, 404);
});

