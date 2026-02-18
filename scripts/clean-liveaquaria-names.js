'use strict';
/**
 * clean-liveaquaria-names.js
 *
 * name ve name_tr alanlarındaki LiveAquaria referanslarını temizler.
 *
 * Kalıplar:
 *   "X at LiveAquaria®"           → "X"
 *   "X LiveAquaria Marine Fish"    → "X"
 *   "LiveAquaria® CCGC Aquacultured X" → "X"
 *   "LiveAquaria® X"               → "X"
 *   Başta/sonda kalan boşluklar, tire, ® temizlenir
 *
 * Çalıştır:
 *   node --experimental-sqlite scripts/clean-liveaquaria-names.js [--dry-run]
 */

const { getDb } = require('../server/db');
const db = getDb();

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('=== DRY-RUN modu ===\n');

function cleanName(name) {
  if (!name) return name;
  let result = name;

  // "X at LiveAquaria" veya "X at LiveAquaria®"
  result = result.replace(/\s+at\s+LiveAquaria®?/gi, '');

  // "X LiveAquaria Marine Fish" gibi sonekleri sil
  result = result.replace(/\s+LiveAquaria®?\s+Marine\s+Fish/gi, '');

  // "LiveAquaria® CCGC Aquacultured X" → "X (Aquacultured)"
  result = result.replace(/^LiveAquaria®?\s+CCGC\s+Aquacultured\s+/gi, '');

  // "LiveAquaria® XYZ Pack" gibi ürün paketleri — sadece paketin adını bırak
  result = result.replace(/^LiveAquaria®?\s+/gi, '');

  // "– LiveAquaria® CCGC" veya "- LiveAquaria CCGC" soneki
  result = result.replace(/\s*[–—-]+\s*LiveAquaria®?\s*CCGC\s*$/gi, '');

  // Kalan ® ve ™ işaretleri
  result = result.replace(/®/g, '');
  result = result.replace(/™/g, '');

  // Baştaki/sondaki tire, boşluk, özel karakter temizle
  result = result.replace(/^[\s–—-]+/, '').replace(/[\s–—-]+$/, '');
  result = result.replace(/\s{2,}/g, ' ').trim();

  return result;
}

// Tüm LiveAquaria içeren isimler
const rows = db.prepare(
  "SELECT id, name, name_tr FROM species WHERE name LIKE '%LiveAquaria%' OR name LIKE '%liveaquaria%'"
).all();

console.log(`Etkilenen kayıt: ${rows.length}\n`);

// Önizleme
console.log('=== Değişiklikler ===');
for (const row of rows) {
  const newName = cleanName(row.name);
  const newNameTr = cleanName(row.name_tr);
  if (newName !== row.name || newNameTr !== row.name_tr) {
    console.log(`  "${row.name}"`);
    console.log(`  → "${newName}"`);
    console.log('');
  }
}

if (DRY_RUN) {
  console.log('Dry-run tamamlandı.');
  process.exit(0);
}

// Uygula
const stmt = db.prepare(
  'UPDATE species SET name = ?, name_tr = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
);

let updated = 0;
for (const row of rows) {
  const newName = cleanName(row.name);
  const newNameTr = cleanName(row.name_tr);
  stmt.run(newName, newNameTr, row.id);
  updated++;
}

console.log(`✓ ${updated} kayıt güncellendi.`);

// Kontrol
const remaining = db.prepare(
  "SELECT COUNT(*) as c FROM species WHERE name LIKE '%LiveAquaria%'"
).get();
console.log(`Kalan "LiveAquaria" içeren isim: ${remaining.c}`);
