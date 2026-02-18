'use strict';
/**
 * clean-liveaquaria.js
 *
 * description_tr ve feeding_tr alanlarından LiveAquaria referanslarını temizler.
 * Strateji: cümle bazlı — LiveAquaria veya Diver's Den içeren cümleleri sil,
 * diğerlerini koru. Böylece asıl içerik zarar görmez.
 *
 * Çalıştır:
 *   node --experimental-sqlite scripts/clean-liveaquaria.js             (gerçek)
 *   node --experimental-sqlite scripts/clean-liveaquaria.js --dry-run   (önizleme)
 */

const { getDb } = require('../server/db');
const db = getDb();

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('=== DRY-RUN modu ===\n');

// Bir cümlede bu kelimelerden biri varsa cümleyi sil
const REMOVE_SENTENCE_IF_CONTAINS = [
  'LiveAquaria',
  "Diver's Den",
  'liveaquaria.com',
  'WYSIWYG',
  'Wisconsin Tesisi',
];

// Cümle ayırıcı: ". " veya "! " veya "? " ile ayır (büyük harf veya satır sonu öncesi)
function splitSentences(text) {
  // Cümleleri böl; noktalama + boşluk sonrası büyük harf veya satır sonu
  return text.split(/(?<=[.!?])\s+/);
}

function containsBadContent(sentence) {
  return REMOVE_SENTENCE_IF_CONTAINS.some(kw =>
    sentence.toLowerCase().includes(kw.toLowerCase())
  );
}

function cleanText(text) {
  if (!text) return text;

  const sentences = splitSentences(text);
  const kept = sentences.filter(s => !containsBadContent(s));

  let result = kept.join(' ').trim();

  // Kalan ® sembollerini temizle (LiveAquaria dışındaki markalar için)
  // Not: Diver's Den ® zaten cümle bazlı silindi, burada sadece artık ®'ler kalır
  result = result.replace(/®/g, '');
  result = result.replace(/™/g, '');

  // Çift boşluk vs temizle
  result = result.replace(/\s{2,}/g, ' ').trim();

  return result;
}

// ─── Önizleme ─────────────────────────────────────────────────────────────
const rows = db.prepare('SELECT id, name, description_tr, feeding_tr FROM species').all();

// Kaç kayıt değişecek?
let willChange = 0;
let charsSaved = 0;
for (const row of rows) {
  const nd = cleanText(row.description_tr);
  const nf = cleanText(row.feeding_tr);
  if (nd !== row.description_tr || nf !== row.feeding_tr) {
    willChange++;
    charsSaved += ((row.description_tr || '').length - (nd || '').length);
    charsSaved += ((row.feeding_tr || '').length - (nf || '').length);
  }
}

console.log(`Değişecek kayıt: ${willChange} / ${rows.length}`);
console.log(`Silinecek toplam karakter: ~${charsSaved.toLocaleString()}\n`);

// İlk 5 örnek göster
console.log('=== İlk 5 değişen kayıt ===\n');
let shown = 0;
for (const row of rows) {
  if (shown >= 5) break;
  const nd = cleanText(row.description_tr);
  if (nd !== row.description_tr) {
    const removed = (row.description_tr || '').length - (nd || '').length;
    console.log(`[${row.name}] ${removed} karakter silindi`);
    console.log(`  Önce: ${(row.description_tr || '').substring(0, 120)}...`);
    console.log(`  Sonra: ${(nd || '').substring(0, 120)}...`);
    console.log('');
    shown++;
  }
}

if (DRY_RUN) {
  console.log('Dry-run bitti. Gerçek çalıştırmak için --dry-run olmadan tekrar çalıştırın.');
  process.exit(0);
}

// ─── Uygula ───────────────────────────────────────────────────────────────
console.log('Güncelleniyor...');
const stmt = db.prepare(
  'UPDATE species SET description_tr = ?, feeding_tr = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
);

let updated = 0;
for (const row of rows) {
  const nd = cleanText(row.description_tr);
  const nf = cleanText(row.feeding_tr);
  if (nd !== row.description_tr || nf !== row.feeding_tr) {
    stmt.run(nd, nf, row.id);
    updated++;
  }
}

console.log(`✓ ${updated} kayıt güncellendi.`);

// Kontrol
const remaining = db.prepare(
  "SELECT COUNT(*) as c FROM species WHERE description_tr LIKE '%LiveAquaria%'"
).get();
console.log(`\nKalan "LiveAquaria" içeren kayıt: ${remaining.c}`);
