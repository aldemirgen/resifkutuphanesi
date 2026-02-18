'use strict';

/**
 * merge-scraper.js
 * Scraper'dan gelen yeni JSON verilerini SQLite'a merge eder.
 * Manuel düzenlenen alanlar (manually_edited_fields listesindekiler) korunur.
 */

const fs = require('fs');
const path = require('path');
const { getDb } = require('../server/db');

const DATA_DIR = path.join(__dirname, '..', 'scraper', 'data');

const FILES = [
  { file: 'marine-fish.json', category: 'marine-fish' },
  { file: 'corals.json', category: 'corals' },
  { file: 'marine-invertebrates.json', category: 'marine-invertebrates' },
];

const db = getDb();

// Tüm güncelleme alanları (manually_edited_fields dışında)
const UPDATABLE_FIELDS = [
  'category', 'subcategory', 'name', 'name_tr', 'scientific_name', 'family',
  'care_level', 'care_level_tr', 'temperament', 'temperament_tr',
  'diet', 'diet_tr', 'max_size', 'min_tank_size',
  'reef_compatible', 'reef_compatible_tr', 'color_form',
  'water_params', 'description', 'description_tr',
  'feeding', 'feeding_tr', 'image_url',
];

let stats = { inserted: 0, updated: 0, protected: 0, unchanged: 0 };

for (const { file, category } of FILES) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ Dosya bulunamadı: ${filePath}`);
    continue;
  }

  const species = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`\n${file}: ${species.length} tür işleniyor...`);

  for (const s of species) {
    const existing = db.prepare('SELECT * FROM species WHERE id = ?').get(s.id);

    if (!existing) {
      // Yeni tür → INSERT
      db.prepare(`
        INSERT INTO species (
          id, category, subcategory, name, name_tr, scientific_name, family,
          care_level, care_level_tr, temperament, temperament_tr,
          diet, diet_tr, max_size, min_tank_size,
          reef_compatible, reef_compatible_tr, color_form,
          water_params, description, description_tr, feeding, feeding_tr,
          image_url, manually_edited_fields
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]')
      `).run(
        s.id,
        s.category || category,
        s.subcategory || null,
        s.name || null,
        s.name_tr || null,
        s.scientific_name || null,
        s.family || null,
        s.care_level || null,
        s.care_level_tr || null,
        s.temperament || null,
        s.temperament_tr || null,
        s.diet || null,
        s.diet_tr || null,
        s.max_size || null,
        s.min_tank_size || null,
        s.reef_compatible || null,
        s.reef_compatible_tr || null,
        s.color_form || null,
        typeof s.water_params === 'string' ? s.water_params : JSON.stringify(s.water_params || {}),
        s.description || null,
        s.description_tr || null,
        s.feeding || null,
        s.feeding_tr || null,
        s.image_url || null
      );
      stats.inserted++;
      continue;
    }

    // Mevcut tür → Merge (manuel alanları koru)
    let editedFields = [];
    try {
      editedFields = JSON.parse(existing.manually_edited_fields || '[]');
    } catch {}

    const updates = {};
    let hasChanges = false;

    for (const field of UPDATABLE_FIELDS) {
      if (editedFields.includes(field)) {
        // Manuel düzenlenmiş → koru
        stats.protected++;
        continue;
      }

      let newVal = s[field] !== undefined ? s[field] : null;
      if (field === 'water_params' && newVal && typeof newVal !== 'string') {
        newVal = JSON.stringify(newVal);
      }

      const existingVal = existing[field];
      if (newVal !== existingVal) {
        updates[field] = newVal;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      const setClause = Object.keys(updates)
        .map((f) => `${f} = ?`)
        .join(', ');
      const values = Object.values(updates);
      db.prepare(`UPDATE species SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(...values, s.id);
      stats.updated++;
    } else {
      stats.unchanged++;
    }
  }
}

console.log('\n✓ Merge tamamlandı:');
console.log(`  Yeni eklenen: ${stats.inserted}`);
console.log(`  Güncellenen:  ${stats.updated}`);
console.log(`  Değişmeyen:   ${stats.unchanged}`);
console.log(`  Korunan alan: ${stats.protected}`);
