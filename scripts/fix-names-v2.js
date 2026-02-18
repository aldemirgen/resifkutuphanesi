'use strict';
/**
 * fix-names-v2.js
 *
 * İlk fix'in kaçırdığı "TürkçeRenk + İngilizceBalıkTipi" kombinasyonlarını düzeltir.
 * Örn: "Sarı Tang" → "Yellow Tang", "Altın Wrasse" → "Gold Wrasse"
 *
 * Çalıştır:
 *   node --experimental-sqlite scripts/fix-names-v2.js
 */

const { getDb } = require('../server/db');
const db = getDb();

// Türkçe → İngilizce renk/sıfat sözlüğü
const TR_TO_EN = [
  ['Sarı Kuyruklu', 'Yellowtail'],   // Bileşik önce gelsin
  ['Sarı', 'Yellow'],
  ['Mavi', 'Blue'],
  ['Kırmızı', 'Red'],
  ['Yeşil', 'Green'],
  ['Turuncu', 'Orange'],
  ['Mor', 'Purple'],
  ['Pembe', 'Pink'],
  ['Siyah', 'Black'],
  ['Beyaz', 'White'],
  ['Altın', 'Gold'],
  ['Gümüş', 'Silver'],
  ['Kahverengi', 'Brown'],
  ['Turkuaz', 'Turquoise'],
  ['Kraliyet', 'Royal'],
  ['Kraliçe', 'Queen'],
  ['İmparator', 'Emperor'],
  ['Kral', 'King'],
  ['Prenses', 'Princess'],
  ['Limonlu', 'Lemon'],
  ['Altın-Gri', 'Gold-Gray'],
];

// Türkçe bağlaçlar (iki renk arasında)
const TR_CONNECTOR_PATTERN = /\b(ve|veya)\b/g;

// İngilizce balık/canlı tipi kelimeleri — bunların önündeki Türkçe renkleri düzelt
const FISH_WORDS = [
  'Tang', 'Wrasse', 'Goby', 'Blenny', 'Clown', 'Clownfish',
  'Damsel', 'Damselfish', 'Angel', 'Angelfish', 'Trigger', 'Triggerfish',
  'Dottyback', 'Anthias', 'Basslet', 'Hawk', 'Hawkfish', 'Grouper',
  'Filefish', 'Foxface', 'Rabbitfish', 'Firefish', 'Dartfish',
  'Chromis', 'Pseudochromis', 'Surgeonfish', 'Butterflyfish', 'Butterfly',
  'Jawfish', 'Lionfish', 'Lion', 'Cardinalfish', 'Cardinal',
  'Seahorse', 'Pipefish', 'Mandarin', 'Dragonet', 'Goatfish',
  'Puffer', 'Pufferfish', 'Boxfish', 'Cowfish', 'Trunkfish',
  'Eel', 'Moray', 'Bassfish', 'Wrasse', 'Parrotfish',
  'Blenny', 'Gramma', 'Assessor',
];

// Fish words pattern (büyük harfle başlar)
const FISH_PATTERN = new RegExp(
  `(?=${FISH_WORDS.join('|')})`, // lookahead — sadece pozisyon testi için
  'i'
);

/**
 * Bir text parçasında "TürkçeRenk SPACE İngilizceBalıkTipi" kalıplarını düzelt.
 * Örn: "Sarı Tang" → "Yellow Tang"
 */
function fixText(text) {
  if (!text) return text;
  let result = text;

  // Her Türkçe renk için, eğer hemen ardından İngilizce bir balık tipi kelimesi geliyorsa değiştir
  for (const [tr, en] of TR_TO_EN) {
    for (const fishWord of FISH_WORDS) {
      // "TürkçeRenk FishWord" — kelime başı/sonu sınırıyla
      const pattern1 = new RegExp(`\\b${escapeRegex(tr)}(?=[ -]${fishWord}\\b)`, 'g');
      result = result.replace(pattern1, en);

      // "TürkçeRenk FishWordlar/ler" (Türkçe çoğul eki)
      const pattern2 = new RegExp(`\\b${escapeRegex(tr)}(?=[ -]${fishWord}(?:lar|ler)\\b)`, 'g');
      result = result.replace(pattern2, en);
    }
  }

  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// === Test ===
const testCases = [
  { input: 'Sarı Tang', expected: 'Yellow Tang' },
  { input: 'yetiştirilmiş Sarı Tanglar sunmaktan gurur', expected: 'yetiştirilmiş Yellow Tangs sunmaktan gurur' },
  { input: 'bilinen Sarı Wrasse, herhangi bir', expected: 'bilinen Yellow Wrasse, herhangi bir' },
  { input: 'Siyah Tang', expected: 'Black Tang' },
  { input: 'Altın Wrasse', expected: 'Gold Wrasse' },
  { input: 'Mor Anthias', expected: 'Purple Anthias' },
  { input: 'Yeşil Dottyback', expected: 'Green Dottyback' },
  { input: 'Mavi ve Altın Blenny', expected: 'Blue ve Gold Blenny' },
  { input: 'Sarı Kuyruklu Siyah Blenny', expected: 'Yellowtail Black Blenny' },
  { input: 'Sarı-Yeşil Goby', expected: 'Yellow-Green Goby' },
  { input: 'Bu balık sarı renklidir.', expected: 'Bu balık sarı renklidir.' },  // küçük harf → değişmemeli
];

console.log('=== Test Sonuçları ===');
let allPassed = true;
for (const { input, expected } of testCases) {
  const result = fixText(input);
  const passed = result === expected;
  if (!passed) allPassed = false;
  console.log(`  ${passed ? '✓' : '✗'} "${input}"`);
  if (!passed) {
    console.log(`      Beklenen: "${expected}"`);
    console.log(`      Sonuç:    "${result}"`);
  }
}

// === Veritabanı ===
console.log('\n=== Veritabanı Taranıyor ===');
const rows = db.prepare('SELECT id, description_tr, feeding_tr FROM species').all();
let updatedCount = 0;
let fixedDescCount = 0;
let fixedFeedCount = 0;

const updateStmt = db.prepare(
  'UPDATE species SET description_tr = ?, feeding_tr = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
);

const changed = [];
for (const row of rows) {
  const newDesc = fixText(row.description_tr);
  const newFeed = fixText(row.feeding_tr);

  if (newDesc !== row.description_tr || newFeed !== row.feeding_tr) {
    updateStmt.run(newDesc, newFeed, row.id);
    updatedCount++;
    if (newDesc !== row.description_tr) {
      fixedDescCount++;
      // Değişen kısımları bul
      changed.push(row.id);
    }
    if (newFeed !== row.feeding_tr) fixedFeedCount++;
  }
}

console.log(`✓ Güncellenen tür: ${updatedCount}`);
console.log(`  description_tr değişen: ${fixedDescCount}`);
console.log(`  feeding_tr değişen: ${fixedFeedCount}`);
if (changed.length > 0) {
  console.log(`  ID'ler: ${changed.join(', ')}`);
}

// Kontrol: hala sorunlu var mı?
const still = [];
const turkishColors = ['Sarı', 'Mavi', 'Kırmızı', 'Yeşil', 'Turuncu', 'Mor', 'Pembe', 'Siyah', 'Beyaz', 'Altın'];
for (const color of turkishColors) {
  for (const fish of FISH_WORDS) {
    const rows2 = db.prepare("SELECT name FROM species WHERE description_tr LIKE ? LIMIT 2").all(`%${color} ${fish}%`);
    for (const r of rows2) still.push(`"${color} ${fish}" in [${r.name}]`);
  }
}

if (still.length === 0) {
  console.log('\n✓ Tüm sorunlar giderildi!');
} else {
  console.log(`\n⚠ Hala ${still.length} sorun var:`);
  still.forEach(s => console.log('  ' + s));
}
