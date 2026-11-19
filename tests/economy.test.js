import test from 'node:test';
import assert from 'node:assert/strict';
import { SHOP_ITEMS, formatInventory, formatShop, normalizeQuantity, utcDay } from '../games/economy/index.js';

test('shop catalog has unique item IDs and positive integer prices', () => {
  assert.equal(new Set(SHOP_ITEMS.map(item => item.id)).size, SHOP_ITEMS.length);
  for (const item of SHOP_ITEMS) {
    assert.ok(Number.isInteger(item.price) && item.price > 0);
  }
});

test('quantity validation allows only 1 through 10', () => {
  assert.equal(normalizeQuantity('1'), 1);
  assert.equal(normalizeQuantity('10'), 10);
  assert.equal(normalizeQuantity('0'), 0);
  assert.equal(normalizeQuantity('11'), 0);
  assert.equal(normalizeQuantity('abc'), 0);
});

test('shop and inventory formatting is safe for empty and populated inventories', () => {
  assert.match(formatShop(), /TOKO PEMAIN/);
  assert.match(formatInventory({}), /Inventaris masih kosong/);
  assert.match(formatInventory({ badge_bintang: 2 }), /Lencana Bintang ×2/);
});

test('daily date uses UTC calendar day', () => {
  assert.equal(utcDay(new Date('2026-10-30T23:30:00.000Z')), '2026-10-30');
});
