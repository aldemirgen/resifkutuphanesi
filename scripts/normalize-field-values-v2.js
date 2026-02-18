'use strict';
/**
 * normalize-field-values-v2.js
 *
 * care_level, temperament, reef_compatible, diet ve bunların _tr
 * karşılıklarındaki kalan İngilizce / bileşik değerleri Türkçeye çevirir.
 *
 * Çalıştır:
 *   node --experimental-sqlite scripts/normalize-field-values-v2.js [--dry-run]
 */

const { getDb } = require('../server/db');
const db = getDb();

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('=== DRY-RUN modu ===\n');

// Tekil kelime/ifade sözlüğü
const DICT = {
  // Bakım seviyeleri
  'Easy': 'Kolay',
  'Moderate': 'Orta',
  'Difficult': 'Zor',
  'Expert Only': 'Sadece Uzman',
  'Expert': 'Uzman',
  // Huy
  'Peaceful': 'Barışçıl',
  'Semi-aggressive': 'Yarı Saldırgan',
  'Semi-Aggressive': 'Yarı Saldırgan',
  'Aggressive': 'Saldırgan',
  'Community Safe': 'Topluluk Güvenli',
  // Resif uyumu
  'Yes': 'Evet',
  'No': 'Hayır',
  'With Caution': 'Dikkatli Olunmalı',
  'Monitor': 'İzlenmeli',
  // Beslenme
  'Omnivore': 'Hepçil',
  'Herbivore': 'Otçul',
  'Carnivore': 'Etçil',
  'Planktivore': 'Planktoncu',
  'Filter Feeder': 'Filtre Besleyici',
  'Photosynthetic': 'Fotosentetik',
  'Plankton Eater': 'Planktoncu',
  'Obligate Corallivore': 'Zorunlu Mercan Yiyici',
  'Detritus': 'Detritüs',
};

// Tam eşleme gerektiren özel durumlar (bileşik / hatalı veri)
const SPECIAL = {
  'Juvenile: Yes; Adult: No': 'Genç: Evet; Yetişkin: Hayır',
  'Easy - Semi Aggressive': 'Yarı Saldırgan',  // scraper hatası
};

function translatePart(part) {
  const trimmed = part.trim();
  return DICT[trimmed] || trimmed;
}

function translateValue(raw) {
  if (!raw) return raw;

  // Özel tam eşleme
  if (SPECIAL[raw]) return SPECIAL[raw];

  // Doğrudan sözlük eşleme
  if (DICT[raw]) return DICT[raw];

  // Zaten Türkçe (değer sözlükte değer olarak geçiyorsa)
  const trValues = Object.values(DICT);
  if (trValues.includes(raw)) return raw;

  // Virgüllü bileşik: "Easy, Easy" veya "Carnivore, Filter Feeder"
  if (raw.includes(',')) {
    const parts = raw.split(',').map(p => translatePart(p));
    const unique = [...new Set(parts)];
    return unique.join(', ');
  }

  // Tire bileşik: "Easy - Moderate" veya "Moderate - Difficult"
  if (raw.includes(' - ')) {
    const parts = raw.split(' - ').map(p => translatePart(p));
    return parts.join(' - ');
  }

  return raw; // çeviri bulunamadı, olduğu gibi bırak
}

// Hangi alanları normalize edeceğiz
const FIELDS = [
  'care_level', 'care_level_tr',
  'temperament', 'temperament_tr',
  'reef_compatible', 'reef_compatible_tr',
  'diet', 'diet_tr',
];

// Tüm satırları bir kez çek
const allRows = db.prepare('SELECT id, ' + FIELDS.join(', ') + ' FROM species').all();

let totalChanges = 0;

for (const field of FIELDS) {
  // Değişecek satırları bul
  const toUpdate = [];
  for (const row of allRows) {
    const original = row[field];
    const translated = translateValue(original);
    if (original !== translated) {
      toUpdate.push({ id: row.id, newVal: translated, oldVal: original });
    }
  }

  console.log(`${field}: ${toUpdate.length} kayıt değişecek`);

  if (DRY_RUN && toUpdate.length > 0) {
    toUpdate.slice(0, 5).forEach(r =>
      console.log(`  [${r.oldVal}] → [${r.newVal}]`)
    );
    if (toUpdate.length > 5) console.log(`  ... ve ${toUpdate.length - 5} kayıt daha`);
  }

  if (!DRY_RUN && toUpdate.length > 0) {
    const stmt = db.prepare(
      `UPDATE species SET ${field} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    );
    db.exec('BEGIN');
    try {
      for (const item of toUpdate) {
        stmt.run(item.newVal, item.id);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    totalChanges += toUpdate.length;
  }
}

if (DRY_RUN) {
  console.log('\nDry-run tamamlandı.');
} else {
  console.log(`\n✓ Toplam ${totalChanges} alan güncellendi.`);

  // Kalan İngilizce kontrol (tüm bilinen İngilizce değerler)
  const enValues = Object.keys(DICT).map(k => `'${k.replace(/'/g, "''")}'`).join(', ');
  for (const field of FIELDS) {
    const rem = db.prepare(
      `SELECT COUNT(*) as c FROM species WHERE ${field} IN (${enValues})`
    ).get();
    if (rem.c > 0) console.log(`⚠ ${field}: ${rem.c} İngilizce değer kaldı`);
  }
  console.log('✓ Kontrol tamamlandı.');
}
