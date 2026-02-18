'use strict';
const { getDb } = require('../server/db');
const db = getDb();

const turkishColors = ['Sarı', 'Mavi', 'Kırmızı', 'Yeşil', 'Turuncu', 'Mor', 'Pembe', 'Siyah', 'Beyaz', 'Altın', 'Gümüş'];
const fishWords = ['Tang', 'Fish', 'Wrasse', 'Goby', 'Blenny', 'Clown', 'Angel', 'Damsel', 'Trigger', 'Parrot', 'Lion', 'Coral', 'Hawk', 'Bass', 'Grouper', 'Dottyback', 'Anthias', 'Basslet'];

const found = [];
for (const color of turkishColors) {
  for (const fish of fishWords) {
    const pattern = color + ' ' + fish;
    const rows = db.prepare(
      "SELECT name, description_tr FROM species WHERE description_tr LIKE ? LIMIT 3"
    ).all('%' + pattern + '%');
    for (const r of rows) {
      const idx = r.description_tr.indexOf(pattern);
      const ctx = r.description_tr.substring(Math.max(0, idx - 15), idx + pattern.length + 20);
      found.push({ name: r.name, pattern, ctx });
    }
  }
}

if (found.length === 0) {
  console.log('Sorun yok! Tüm tür isim çevirileri düzelmiş görünüyor.');
} else {
  console.log('Hala sorunlu olanlar (' + found.length + ' eşleşme):');
  found.forEach(f => {
    console.log('  [' + f.name + '] "' + f.pattern + '": ...' + f.ctx + '...');
  });
}

// Ayrıca name_tr == name kontrolü
const diffCount = db.prepare("SELECT COUNT(*) as c FROM species WHERE name_tr != name AND name_tr IS NOT NULL AND name IS NOT NULL").get();
console.log('\nname != name_tr olan tür sayısı: ' + diffCount.c);

// Örnek diffler
if (diffCount.c > 0) {
  const diffs = db.prepare("SELECT name, name_tr FROM species WHERE name_tr != name AND name_tr IS NOT NULL AND name IS NOT NULL LIMIT 10").all();
  diffs.forEach(d => console.log('  name: "' + d.name + '" | name_tr: "' + d.name_tr + '"'));
}
