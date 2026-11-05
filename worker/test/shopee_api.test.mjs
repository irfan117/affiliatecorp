import test from 'node:test';
import assert from 'node:assert/strict';
import { ShopeeAffiliateClient } from '../../ops/shopee_api.mjs';

test('1. ShopeeAffiliateClient menghasilkan format authorization header SHA256 yang tepat', () => {
  const client = new ShopeeAffiliateClient('12345678', 'test_secret_key_abcdef');
  assert.equal(client.isConfigured(), true);

  const payload = JSON.stringify({ query: '{ test }' });
  const headers = client.generateAuthHeaders(payload);

  assert.equal(headers['Content-Type'], 'application/json');
  assert.ok(headers.Authorization.startsWith('SHA256 Credential=12345678, Timestamp='));
  assert.ok(headers.Authorization.includes('Signature='));
});

