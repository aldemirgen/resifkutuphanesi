'use strict';
const { getDb } = require('../server/db');
const db = getDb();

// Türkçe balık tipi kelimeleri (İngilizceleriyle eşleştirilmiş)
const TR_FISH_WORDS = {
  'Cerrah Balığı': 'Surgeonfish',
  'Cerrahbalığı': 'Surgeonfish',
  'Cerrah': 'Surgeon',           // "Kırmızı Kuyruklu Cerrah" gibi
  'Perisi': 'Fairy',             // "Wrasse Perisi" gibi
  'Melek Balığı': 'Angelfish',
  'Melek': 'Angel',
  'Tetikçi Balığı': 'Triggerfish',
  'Kelebek Balığı': 'Butterflyfish',
  'Aslan Balığı': 'Lionfish',
  'Papağan Balığı': 'Parrotfish',
  'Akrep Balığı': 'Scorpionfish',
  'Kardinal Balığı': 'Cardinalfish',
  'Çene Balığı': 'Jawfish',
  'Boru Balığı': 'Pipefish',
  'Keçi Balığı': 'Goatfish',
  'Denizatı': 'Seahorse',
  'Balık': 'Fish',               // Generic
  'Tangı': 'Tang',               // Possessive suffix (e.g. "Aşil Tangı")
  'Tangın': 'Tang',
};

// Türkçe çevrilmiş tür ismi kalıpları
const patterns = [
  // Cerrah kalıpları
  /\bAşil (Tang[ıı]?|Cerrah Balığ[ıi]?)\b/g,
  /\bKırmızı Kuyruklu Cerrah\b/g,
  /\bPowder Brown Tang\b/g,  // Bu zaten İngilizce, atla
  /\bÇevik Chromis\b/g,
  /\bNimble Chromis\b/g,
  // Genel: herhangi Türkçe sıfat + Türkçe balık türü
];

// Arama: Türkçe balık tipi kelimeler içeren description_tr'leri bul
console.log('=== Türkçe Balık Tipi Kelimeleri Taraması ===\n');

for (const [trFish, enFish] of Object.entries(TR_FISH_WORDS)) {
  const rows = db.prepare(
    "SELECT name, substr(description_tr, max(1, instr(description_tr, ?) - 30), 80) as ctx FROM species WHERE description_tr LIKE ? LIMIT 5"
  ).all(trFish, '%' + trFish + '%');

  if (rows.length > 0) {
    console.log(`"${trFish}" → "${enFish}" (${rows.length} eşleşme):`);
    rows.forEach(r => console.log(`  [${r.name}]: ...${r.ctx}...`));
    console.log('');
  }
}

// Özel: "Tangı", "Tangın" (possessive)
const tangRows = db.prepare(
  "SELECT name, substr(description_tr, max(1, instr(description_tr, 'Tang') - 20), 60) as ctx FROM species WHERE description_tr LIKE '%Tangı%' OR description_tr LIKE '%Tangın%' LIMIT 10"
).all();
if (tangRows.length > 0) {
  console.log('"Tang" possessive ekleri:');
  tangRows.forEach(r => console.log(`  [${r.name}]: ...${r.ctx}...`));
}

// Özel: "Çevik" kelimesi
const cevikRows = db.prepare(
  "SELECT name, substr(description_tr, max(1, instr(description_tr, 'Çevik') - 10), 60) as ctx FROM species WHERE description_tr LIKE '%Çevik%' LIMIT 5"
).all();
if (cevikRows.length > 0) {
  console.log('\n"Çevik" kelimesi:');
  cevikRows.forEach(r => console.log(`  [${r.name}]: ...${r.ctx}...`));
}
