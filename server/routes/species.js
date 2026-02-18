'use strict';

const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM species').get();
  const byCategory = db.prepare(
    'SELECT category, COUNT(*) as count FROM species GROUP BY category'
  ).all();

  const stats = { total: total.count, byCategory: {} };
  byCategory.forEach((r) => {
    stats.byCategory[r.category] = r.count;
  });

  res.json(stats);
});

// GET /api/species
router.get('/', (req, res) => {
  const db = getDb();
  const { category, search, page = 1, limit = 9999 } = req.query;

  let query = 'SELECT * FROM species WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    const q = `%${search}%`;
    query += ' AND (name LIKE ? OR name_tr LIKE ? OR scientific_name LIKE ? OR family LIKE ? OR subcategory LIKE ?)';
    params.push(q, q, q, q, q);
  }

  query += ' ORDER BY name ASC';

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  if (limitNum < 9999) {
    query += ' LIMIT ? OFFSET ?';
    params.push(limitNum, (pageNum - 1) * limitNum);
  }

  const rows = db.prepare(query).all(...params);

  // Parse JSON fields
  const species = rows.map(parseRow);
  res.json(species);
});

// GET /api/species/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM species WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Tür bulunamadı' });
  }
  res.json(parseRow(row));
});

// POST /api/species (protected)
router.post('/', requireAuth, (req, res) => {
  const db = getDb();
  const species = req.body;

  if (!species.id || !species.category) {
    return res.status(400).json({ error: 'id ve category alanları zorunlu' });
  }

  const existing = db.prepare('SELECT id FROM species WHERE id = ?').get(species.id);
  if (existing) {
    return res.status(409).json({ error: 'Bu ID zaten mevcut' });
  }

  const row = prepareRow(species);
  db.prepare(`
    INSERT INTO species (
      id, category, subcategory, name, name_tr, scientific_name, family,
      care_level, care_level_tr, temperament, temperament_tr,
      diet, diet_tr, max_size, min_tank_size,
      reef_compatible, reef_compatible_tr, color_form,
      water_params, description, description_tr, feeding, feeding_tr,
      image_url, manually_edited_fields
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?
    )
  `).run(
    row.id, row.category, row.subcategory, row.name, row.name_tr,
    row.scientific_name, row.family,
    row.care_level, row.care_level_tr,
    row.temperament, row.temperament_tr,
    row.diet, row.diet_tr,
    row.max_size, row.min_tank_size,
    row.reef_compatible, row.reef_compatible_tr,
    row.color_form, row.water_params,
    row.description, row.description_tr,
    row.feeding, row.feeding_tr,
    row.image_url, row.manually_edited_fields
  );

  const created = db.prepare('SELECT * FROM species WHERE id = ?').get(species.id);
  res.status(201).json(parseRow(created));
});

// PUT /api/species/:id (protected)
router.put('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM species WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Tür bulunamadı' });
  }

  const updates = req.body;
  const editedFields = updates.manually_edited_fields || [];

  const merged = { ...parseRow(existing), ...updates, manually_edited_fields: editedFields };
  const row = prepareRow(merged);

  db.prepare(`
    UPDATE species SET
      category = ?, subcategory = ?, name = ?, name_tr = ?,
      scientific_name = ?, family = ?,
      care_level = ?, care_level_tr = ?,
      temperament = ?, temperament_tr = ?,
      diet = ?, diet_tr = ?,
      max_size = ?, min_tank_size = ?,
      reef_compatible = ?, reef_compatible_tr = ?,
      color_form = ?, water_params = ?,
      description = ?, description_tr = ?,
      feeding = ?, feeding_tr = ?,
      image_url = ?, manually_edited_fields = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    row.category, row.subcategory, row.name, row.name_tr,
    row.scientific_name, row.family,
    row.care_level, row.care_level_tr,
    row.temperament, row.temperament_tr,
    row.diet, row.diet_tr,
    row.max_size, row.min_tank_size,
    row.reef_compatible, row.reef_compatible_tr,
    row.color_form, row.water_params,
    row.description, row.description_tr,
    row.feeding, row.feeding_tr,
    row.image_url, row.manually_edited_fields,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM species WHERE id = ?').get(req.params.id);
  res.json(parseRow(updated));
});

// DELETE /api/species/:id (protected)
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM species WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Tür bulunamadı' });
  }

  db.prepare('DELETE FROM species WHERE id = ?').run(req.params.id);
  res.json({ success: true, id: req.params.id });
});

// Helper: parse stored row (JSON fields)
function parseRow(row) {
  return {
    ...row,
    water_params: safeParseJSON(row.water_params, {}),
    manually_edited_fields: safeParseJSON(row.manually_edited_fields, []),
  };
}

// Helper: prepare row for storage (stringify JSON fields)
function prepareRow(obj) {
  return {
    id: obj.id || '',
    category: obj.category || '',
    subcategory: obj.subcategory || null,
    name: obj.name || null,
    name_tr: obj.name_tr || null,
    scientific_name: obj.scientific_name || null,
    family: obj.family || null,
    care_level: obj.care_level || null,
    care_level_tr: obj.care_level_tr || null,
    temperament: obj.temperament || null,
    temperament_tr: obj.temperament_tr || null,
    diet: obj.diet || null,
    diet_tr: obj.diet_tr || null,
    max_size: obj.max_size || null,
    min_tank_size: obj.min_tank_size || null,
    reef_compatible: obj.reef_compatible || null,
    reef_compatible_tr: obj.reef_compatible_tr || null,
    color_form: obj.color_form || null,
    water_params: typeof obj.water_params === 'string'
      ? obj.water_params
      : JSON.stringify(obj.water_params || {}),
    description: obj.description || null,
    description_tr: obj.description_tr || null,
    feeding: obj.feeding || null,
    feeding_tr: obj.feeding_tr || null,
    image_url: obj.image_url || null,
    manually_edited_fields: Array.isArray(obj.manually_edited_fields)
      ? JSON.stringify(obj.manually_edited_fields)
      : (obj.manually_edited_fields || '[]'),
  };
}

function safeParseJSON(str, fallback) {
  if (!str) return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

module.exports = router;
