'use strict';
/**
 * fix-translated-names.js
 *
 * description_tr ve feeding_tr metinlerinde çevrilmiş tür isimlerini
 * İngilizce orijinalleriyle değiştirir.
 *
 * Yöntem:
 *  1. Tüm species'den (name, name_tr) eşleşmeleri al
 *  2. Her ismin olası Türkçe çevirilerini üret (renk sıfatları vb.)
 *  3. description_tr / feeding_tr içinde bul-değiştir yap
 *  4. Değişen kayıtları SQLite'a yaz
 *
 * Çalıştır:
 *  node --experimental-sqlite scripts/fix-translated-names.js
 */

const { getDb } = require('../server/db');
const db = getDb();

// Türkçe → İngilizce renk/sıfat sözlüğü (Google Translate'in ürettiği yaygın çeviriler)
const TR_TO_EN = {
  'Sarı': 'Yellow',
  'Mavi': 'Blue',
  'Kırmızı': 'Red',
  'Yeşil': 'Green',
  'Turuncu': 'Orange',
  'Mor': 'Purple',
  'Pembe': 'Pink',
  'Siyah': 'Black',
  'Beyaz': 'White',
  'Altın': 'Gold',
  'Gümüş': 'Silver',
  'Kahverengi': 'Brown',
  'Gri': 'Gray',
  'Krem': 'Cream',
  'Lacivert': 'Navy',
  'Turkuaz': 'Turquoise',
  'Koral': 'Coral',
  'Eflatun': 'Lavender',
  'Açık Mavi': 'Light Blue',
  'Koyu Mavi': 'Dark Blue',
  'Koyu': 'Dark',
  'Açık': 'Light',
  'Kraliyet': 'Royal',
  'Ateş': 'Fire',
  'Çizgili': 'Striped',
  'Benekli': 'Spotted',
  'Alacalı': 'Mottled',
  'Dev': 'Giant',
  'Cüce': 'Dwarf',
  'Ortak': 'Common',
  'Büyük': 'Large',
  'Küçük': 'Small',
  'Uzun': 'Long',
  'Kısa': 'Short',
  'Yıldız': 'Star',
  'Ay': 'Moon',
  'Güneş': 'Sun',
  'Kaya': 'Rock',
  'Deniz': 'Sea',
  'Okyanus': 'Ocean',
  'Pasifik': 'Pacific',
  'Atlantik': 'Atlantic',
  'Hint': 'Indian',
  'Kaplan': 'Tiger',
  'Aslan': 'Lion',
  'Kartal': 'Eagle',
  'Papağan': 'Parrot',
  'Melek': 'Angel',
  'Şeytan': 'Devil',
  'Peri': 'Fairy',
  'Prenses': 'Princess',
  'Prens': 'Prince',
  'Kral': 'King',
  'Kraliçe': 'Queen',
  'İmparator': 'Emperor',
};

// İngilizce tür isimlerini al (uzunluğa göre sırala - uzun önce gelsin)
const allSpecies = db.prepare('SELECT id, name FROM species WHERE name IS NOT NULL').all();
const sortedNames = allSpecies
  .map(s => s.name.trim())
  .filter(n => n.length >= 4)
  .sort((a, b) => b.length - a.length);

console.log(`Toplam tür: ${sortedNames.length}`);

/**
 * Bir tür isminin olası Türkçe çevirilerini üret.
 * Örnek: "Yellow Tang" → ["Sarı Tang", "sarı tang"]
 */
function buildTurkishVariants(englishName) {
  const variants = new Set();
  let turkishName = englishName;

  // Her İngilizce sıfat/renk kelimesini Türkçe karşılığıyla değiştir
  for (const [tr, en] of Object.entries(TR_TO_EN)) {
    // Tam kelime eşleşmesi
    const pattern = new RegExp(`\\b${en}\\b`, 'gi');
    if (pattern.test(turkishName)) {
      const variant = turkishName.replace(pattern, tr);
      if (variant !== turkishName) {
        variants.add(variant);
        variants.add(variant.toLowerCase());
      }
    }
  }

  return Array.from(variants).filter(v => v !== englishName && v.length >= 4);
}

// Her tür için olası Türkçe çevirilerini önceden hesapla
const nameVariantMap = new Map(); // turkishVariant → englishName
for (const name of sortedNames) {
  const variants = buildTurkishVariants(name);
  for (const v of variants) {
    if (!nameVariantMap.has(v)) {
      nameVariantMap.set(v, name);
    }
  }
}

console.log(`Tespit edilen olası Türkçe çeviri sayısı: ${nameVariantMap.size}`);

// En uzun variant önce gelsin (kısmi eşleşmeleri önlemek için)
const sortedVariants = Array.from(nameVariantMap.keys())
  .sort((a, b) => b.length - a.length);

/**
 * Bir metindeki tüm Türkçe tür isim çevirilerini İngilizcesiyle değiştir.
 */
function fixText(text) {
  if (!text) return text;
  let result = text;
  for (const variant of sortedVariants) {
    if (!result.toLowerCase().includes(variant.toLowerCase())) continue;
    const original = nameVariantMap.get(variant);
    const pattern = new RegExp(variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(pattern, original);
  }
  return result;
}

// Tüm species'i tara ve güncelle
const rows = db.prepare('SELECT id, description_tr, feeding_tr FROM species').all();
let updatedCount = 0;
let fixedFieldCount = 0;

const updateStmt = db.prepare(
  'UPDATE species SET description_tr = ?, feeding_tr = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
);

for (const row of rows) {
  const newDesc = fixText(row.description_tr);
  const newFeed = fixText(row.feeding_tr);

  if (newDesc !== row.description_tr || newFeed !== row.feeding_tr) {
    updateStmt.run(newDesc, newFeed, row.id);
    updatedCount++;
    if (newDesc !== row.description_tr) fixedFieldCount++;
    if (newFeed !== row.feeding_tr) fixedFieldCount++;
  }
}

console.log(`\n✓ Tamamlandı:`);
console.log(`  Güncellenen tür: ${updatedCount}`);
console.log(`  Güncellenen alan: ${fixedFieldCount}`);

// Çekilmiş check-names.js scriptini de temizle
