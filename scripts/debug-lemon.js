'use strict';
const { getDb } = require('../server/db');
const db = getDb();

// Magma Wrasse - tüm description (tam)
const magma = db.prepare("SELECT description_tr FROM species WHERE name = 'Magma Wrasse'").get();
if (magma) {
  const text = magma.description_tr;
  // "wrasse" kelimesi etrafındaki bağlamı bul (case-insensitive)
  const lowerText = text.toLowerCase();
  let idx = 0;
  while ((idx = lowerText.indexOf('wrasse', idx)) >= 0) {
    console.log('wrasse @' + idx + ': ...' + text.substring(Math.max(0, idx-30), idx+40) + '...');
    idx++;
  }
}

// Lemon Damselfish - "sarı" (küçük) var mı?
const lemon = db.prepare("SELECT description_tr FROM species WHERE name = 'Lemon Damselfish' LIMIT 1").get();
if (lemon) {
  console.log('\nLemon Damselfish - sarı/Sarı bağlamları:');
  const text = lemon.description_tr;
  const lowerText = text.toLowerCase();
  let idx = 0;
  while ((idx = lowerText.indexOf('sarı', idx)) >= 0) {
    console.log('  @' + idx + ': ...' + text.substring(Math.max(0, idx-10), idx+30) + '...');
    idx++;
  }
}
