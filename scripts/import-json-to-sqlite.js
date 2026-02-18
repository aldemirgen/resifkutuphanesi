'use strict';

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

let total = 0;
let inserted = 0;
let skipped = 0;

for (const { file, category } of FILES) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ Dosya bulunamadı: ${filePath}`);
    continue;
  }

  const species = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`\n${file}: ${species.length} tür`);

  for (const s of species) {
    total++;
    const existing = db.prepare('SELECT id FROM species WHERE id = ?').get(s.id);
    if (existing) {
      skipped++;
      continue;
    }

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
    inserted++;
  }
}

console.log(`\n✓ Import tamamlandı: ${inserted} eklendi, ${skipped} atlandı (toplam: ${total})`);
