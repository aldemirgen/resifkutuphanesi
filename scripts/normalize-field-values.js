'use strict';
/**
 * normalize-field-values.js
 *
 * care_level, temperament, reef_compatible, diet alanlarındaki
 * İngilizce değerleri Türkçeye çevirir. Zaten Türkçe olanlar dokunulmaz.
 *
 * Çalıştır:
 *   node --experimental-sqlite scripts/normalize-field-values.js [--dry-run]
 */

const { getDb } = require('../server/db');
const db = getDb();

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('=== DRY-RUN modu ===\n');

const CARE_LEVELS = {
  'Easy': 'Kolay',
  'Moderate': 'Orta',
  'Difficult': 'Zor',
  'Expert Only': 'Sadece Uzman',
  'Expert': 'Uzman',
};

const TEMPERAMENTS = {
  'Peaceful': 'Barışçıl',
  'Semi-aggressive': 'Yarı Saldırgan',
  'Semi-Aggressive': 'Yarı Saldırgan',
  'Aggressive': 'Saldırgan',
  'Community Safe': 'Topluluk Güvenli',
};

const REEF_COMPAT = {
  'Yes': 'Evet',
  'No': 'Hayır',
  'With Caution': 'Dikkatli Olunmalı',
  'Monitor': 'İzlenmeli',
};

const DIETS = {
  'Omnivore': 'Hepçil',
  'Herbivore': 'Otçul',
  'Carnivore': 'Etçil',
  'Planktivore': 'Planktoncu',
  'Filter Feeder': 'Filtre Besleyici',
  'Photosynthetic': 'Fotosentetik',
};

function normalizeField(fieldName, dict) {
  const englishValues = Object.keys(dict);
  const placeholders = englishValues.map(() => '?').join(', ');

  const rows = db.prepare(
    `SELECT id, ${fieldName} FROM species WHERE ${fieldName} IN (${placeholders})`
  ).all(...englishValues);

  console.log(`${fieldName}: ${rows.length} kayıt güncellenecek`);

  if (!DRY_RUN && rows.length > 0) {
    const stmt = db.prepare(
      `UPDATE species SET ${fieldName} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    );
    db.exec('BEGIN');
    try {
      for (const row of rows) {
        const tr = dict[row[fieldName]];
        if (tr) stmt.run(tr, row.id);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }

  return rows.length;
}

let total = 0;
total += normalizeField('care_level', CARE_LEVELS);
total += normalizeField('temperament', TEMPERAMENTS);
total += normalizeField('reef_compatible', REEF_COMPAT);
total += normalizeField('diet', DIETS);

if (DRY_RUN) {
  console.log(`\nToplam ${total} alan güncellenecekti.`);
  console.log('Dry-run tamamlandı.');
} else {
  console.log(`\n✓ Toplam ${total} alan güncellendi.`);

  // Kontrol: kalan İngilizce değerler
  const remaining = db.prepare(
    "SELECT care_level, COUNT(*) as c FROM species WHERE care_level IN ('Easy','Moderate','Difficult','Expert Only','Expert') GROUP BY care_level"
  ).all();
  if (remaining.length === 0) {
    console.log('✓ care_level: İngilizce değer kalmadı.');
  } else {
    console.log('Kalan İngilizce care_level:', remaining);
  }
}
