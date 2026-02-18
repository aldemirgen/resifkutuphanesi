'use strict';
const { getDb } = require('../server/db');
const db = getDb();

// Kullanıcının verdiği örnekleri kontrol et
const checks = [
  { species: 'Agile Chromis, Chromis agilis', search: 'Çevik Chromis', alt: 'Agile Chromis' },
  { species: 'Achilles Tang, Acanthurus achilles', search: 'Aşil Tangı', alt: 'Aşil Tang' },
  { species: 'Achilles Tang, Acanthurus achilles', search: 'Cerrah Balığı', alt: 'Surgeonfish' },
  { species: 'Flame Angelfish', search: 'Alev Melek Balığı', alt: 'Flame Angelfish' },
  { species: 'Half Black Angelfish', search: 'Yarı Siyah Melek Balığı', alt: 'Half Black Angelfish' },
  { species: 'Volitan Lionfish, Colored', search: 'Aslan Balığı', alt: 'Lionfish' },
  { species: 'Pajama Cardinalfish', search: 'Kardinal Balığı', alt: 'Cardinalfish' },
  { species: 'Blue Throat Fairy Wrasse', search: 'Perisi Wrasse', alt: 'Fairy Wrasse' },
  { species: 'Blue Caribbean Tang', search: 'Mavi Karayip', alt: 'Blue Caribbean' },
];

console.log('=== Düzeltme Sonrası Kontrol ===\n');

for (const c of checks) {
  const row = db.prepare("SELECT description_tr FROM species WHERE name = ? LIMIT 1").get(c.species);
  if (!row) { console.log(`  [?] ${c.species} bulunamadı`); continue; }

  const hasOld = row.description_tr.includes(c.search);
  const hasNew = row.description_tr.includes(c.alt);
  const status = !hasOld ? (hasNew ? '✓ DÜZELDI' : '? belirsiz') : '✗ HALA VAR';

  console.log(`  ${status} [${c.species}]`);
  console.log(`         Aranan: "${c.search}" → ${hasOld ? 'MEVCUT' : 'yok'}`);
  console.log(`         Yeni form: "${c.alt}" → ${hasNew ? 'MEVCUT' : 'yok'}`);

  // Bağlam göster
  const text = row.description_tr;
  const idx = text.indexOf(c.alt);
  if (idx >= 0) {
    console.log(`         Bağlam: ...${text.substring(Math.max(0,idx-20), idx+c.alt.length+30)}...`);
  }
  console.log('');
}
