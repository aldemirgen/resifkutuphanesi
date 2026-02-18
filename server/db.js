'use strict';

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS species (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      subcategory TEXT,
      name TEXT,
      name_tr TEXT,
      scientific_name TEXT,
      family TEXT,
      care_level TEXT,
      care_level_tr TEXT,
      temperament TEXT,
      temperament_tr TEXT,
      diet TEXT,
      diet_tr TEXT,
      max_size TEXT,
      min_tank_size TEXT,
      reef_compatible TEXT,
      reef_compatible_tr TEXT,
      color_form TEXT,
      water_params TEXT,
      description TEXT,
      description_tr TEXT,
      feeding TEXT,
      feeding_tr TEXT,
      image_url TEXT,
      manually_edited_fields TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
  `);
}

module.exports = { getDb };
