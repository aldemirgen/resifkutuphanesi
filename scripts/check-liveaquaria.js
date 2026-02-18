'use strict';
const { getDb } = require('../server/db');
const db = getDb();

// Coral Beauty tam açıklaması
const cb = db.prepare("SELECT description_tr FROM species WHERE name LIKE '%Coral Beauty%' LIMIT 1").get();
if (cb) {
  console.log('=== Coral Beauty description_tr ===');
  console.log(cb.description_tr);
  console.log('\n---');
}

// LiveAquaria geçen kayıtlarda örüntüler
console.log('\n=== LiveAquaria geçen örnek cümleler ===');
const rows = db.prepare(
  "SELECT name, description_tr FROM species WHERE description_tr LIKE '%LiveAquaria%' LIMIT 5"
).all();
for (const r of rows) {
  const idx = r.description_tr.toLowerCase().indexOf('liveaquaria');
  const ctx = r.description_tr.substring(Math.max(0, idx - 30), idx + 60);
  console.log(`[${r.name}]: ...${ctx}...`);
}

// Diver's Den içeren kayıt sayısı
const dd = db.prepare("SELECT COUNT(*) as c FROM species WHERE description_tr LIKE \"%Diver's Den%\"").get();
console.log('\nDiver\'s Den içeren: ' + dd.c);

// SADECE Diver's Den olan (başka içerik yok)
const ddOnly = db.prepare(
  "SELECT COUNT(*) as c FROM species WHERE description_tr LIKE \"%Diver's Den%\" AND length(description_tr) < 2000"
).get();
console.log("Kısa (< 2000 karakter) Diver's Den içeren: " + ddOnly.c);
