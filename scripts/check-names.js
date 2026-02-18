'use strict';
const { getDb } = require('../server/db');
const db = getDb();

// "Sarı" hala kaç yerde var?
const withSari = db.prepare("SELECT COUNT(*) as c FROM species WHERE description_tr LIKE '%Sarı %'").get();
console.log('"Sarı " geçen description_tr sayısı: ' + withSari.c);

// Örnek: Yellow Tang
const yt = db.prepare("SELECT name, substr(description_tr,1,300) as d FROM species WHERE name LIKE '%Yellow Tang%' LIMIT 1").get();
if (yt) {
  console.log('\nÖrnek - ' + yt.name + ':');
  console.log(yt.d);
}

// "Mavi Tang" veya "Blue Tang" kontrolü
const bt = db.prepare("SELECT name, substr(description_tr, instr(description_tr,'Tang')-20, 60) as ctx FROM species WHERE description_tr LIKE '%Tang%' AND name LIKE '%Tang%' LIMIT 5").all();
console.log('\nTang geçen açıklamalar:');
bt.forEach(r => console.log(' [' + r.name + '] ...' + r.ctx + '...'));
