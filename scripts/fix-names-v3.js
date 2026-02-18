'use strict';
/**
 * fix-names-v3.js
 *
 * Kapsamlı düzeltme:
 *  - Balık türü kelimelerinin Türkçe çevirilerini geri çevirir
 *    (Cerrah Balığı → Surgeonfish, Melek Balığı → Angelfish, vb.)
 *  - Ek sıfat çevirilerini düzeltir (Çevik → Agile, Alev → Flame, vb.)
 *  - Türkçe iyelik eklerini kaldırır (Tangı → Tang, vb.)
 *  - BFS tabanlı varyant üretimi ile zincirleme çevirileri yakalar
 *    (Alev Angelfish + Flame Melek Balığı → Alev Melek Balığı → Flame Angelfish)
 *
 * Çalıştır:
 *   node --experimental-sqlite scripts/fix-names-v3.js
 */

const { getDb } = require('../server/db');
const db = getDb();

// ─── Türkçe → İngilizce Sözlük ──────────────────────────────────────────────
// Sıra ÖNEMLİ: uzun ifadeler önce gelsin (kısa ifadenin yanlış eşleşmesini önler)
const TR_TO_EN = [
  // Balık türü bileşik kelimeler (uzun → kısa sıra)
  ['Cerrah Balığı',   'Surgeonfish'],
  ['Melek Balığı',    'Angelfish'],
  ['Kelebek Balığı',  'Butterflyfish'],
  ['Aslan Balığı',    'Lionfish'],
  ['Akrep Balığı',    'Scorpionfish'],
  ['Kardinal Balığı', 'Cardinalfish'],
  ['Çene Balığı',     'Jawfish'],
  ['Keçi Balığı',     'Goatfish'],
  ['Tetikçi Balığı',  'Triggerfish'],
  ['Papağan Balığı',  'Parrotfish'],
  ['Şeytan Balığı',   'Devilfish'],
  ['Boru Balığı',     'Pipefish'],

  // Çok-kelimeli sıfatlar/bileşikler
  ['Sarı Kuyruklu',   'Yellowtail'],
  ['Kırmızı Kuyruklu','Redtail'],
  ['Uzun Burunlu',    'Longnose'],
  ['Uzun Yüzgeçli',   'Longfin'],
  ['Kısa Yüzgeçli',   'Shortfin'],
  ['İki Renkli',      'Bicolor'],
  ['Çift Renkli',     'Bicolor'],
  ['İnce Çizgili',    'Finelined'],
  ['Limon Kabuğu',    'Lemonpeel'],
  ['Kara Nokta',      'Black Spot'],
  ['Mavi Boğaz',      'Blue Throat'],
  ['Mavi Benekli',    'Blue Dot'],
  ['Mavi Nokta',      'Blue Dot'],
  ['Kızıl Kafa',      'Red Head'],

  // Tek renkler / sıfatlar
  ['Sarı',        'Yellow'],
  ['Mavi',        'Blue'],
  ['Kırmızı',     'Red'],
  ['Yeşil',       'Green'],
  ['Turuncu',     'Orange'],
  ['Mor',         'Purple'],
  ['Pembe',       'Pink'],
  ['Siyah',       'Black'],
  ['Beyaz',       'White'],
  ['Altın',       'Gold'],
  ['Gümüş',       'Silver'],
  ['Kahverengi',  'Brown'],
  ['Gri',         'Gray'],
  ['Krem',        'Cream'],
  ['Turkuaz',     'Turquoise'],
  ['Kraliyet',    'Royal'],
  ['Ateş',        'Fire'],
  ['Kraliçe',     'Queen'],
  ['İmparator',   'Emperor'],
  ['Kral',        'King'],
  ['Prenses',     'Princess'],
  ['Limonlu',     'Lemon'],
  ['Karayip',     'Caribbean'],

  // Tanımlayıcı sıfatlar
  ['Çevik',       'Agile'],
  ['Alev',        'Flame'],
  ['Yarı',        'Half'],
  ['Pijama',      'Pajama'],
  ['Yelken',      'Sailfin'],
  ['Benekli',     'Spotted'],
  ['Yanaklı',     'Cheeked'],
  ['Burunlu',     'Nosed'],
  ['Çizgili',     'Striped'],
  ['Alacalı',     'Mottled'],
  ['Dev',         'Giant'],
  ['Cüce',        'Dwarf'],
  ['Ortak',       'Common'],
  ['Uzun',        'Long'],
  ['Küçük',       'Small'],
  ['Büyük',       'Large'],
  ['Yıldız',      'Star'],
  ['Kaplan',      'Tiger'],
  ['Melek',       'Angel'],    // standalone (Fairy Angel gibi)

  // Tek balık türü kelimeleri (Cerrah gibi standalone kullananlar için)
  ['Cerrah',      'Surgeon'],  // "Kırmızı Kuyruklu Cerrah" → "Redtail Surgeon"
  ['Perisi',      'Fairy'],    // "X Perisi Wrasse" → "X Fairy Wrasse"
];

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * BFS ile tüm Türkçe varyantları üret.
 * Örn: "Flame Angelfish" → ["Alev Angelfish", "Flame Melek Balığı", "Alev Melek Balığı"]
 */
function buildAllTurkishVariants(englishName) {
  const allVariants = new Set();
  const queue = [englishName];
  const seen = new Set([englishName.toLowerCase()]);

  while (queue.length > 0) {
    const current = queue.shift();
    for (const [tr, en] of TR_TO_EN) {
      const regex = new RegExp(`\\b${escapeRegex(en)}\\b`, 'gi');
      if (!regex.test(current)) continue;
      regex.lastIndex = 0;
      const variant = current.replace(regex, tr);
      if (variant === current) continue;
      const variantLower = variant.toLowerCase();
      if (!seen.has(variantLower)) {
        seen.add(variantLower);
        if (variant !== englishName) {
          allVariants.add(variant);
          allVariants.add(variant.toLowerCase());
        }
        queue.push(variant);
      }
    }

    // Tang possessive varyantları
    if (/\bTang\b/.test(current)) {
      for (const possessive of ['Tangı', 'Tangın', 'Tangların', 'Tangların']) {
        const v = current.replace(/\bTang\b/g, possessive);
        if (!seen.has(v.toLowerCase())) {
          seen.add(v.toLowerCase());
          allVariants.add(v);
          allVariants.add(v.toLowerCase());
        }
      }
    }
  }

  return Array.from(allVariants).filter(v => v.length >= 4);
}

// ─── Tüm türlerin varyantlarını önceden hesapla ──────────────────────────────
const allSpecies = db.prepare('SELECT id, name FROM species WHERE name IS NOT NULL').all();

// Her tür için hem tam isim hem kısa isim (bilimsel ad öncesi) üret
function getNameForms(fullName) {
  const forms = [fullName];
  // Parantez öncesi: "Achilles Tang (Acanthurus achilles)" → "Achilles Tang"
  const parenIdx = fullName.indexOf('(');
  if (parenIdx > 0) forms.push(fullName.substring(0, parenIdx).trim());
  // Virgül öncesi: "Agile Chromis, Chromis agilis" → "Agile Chromis"
  const commaIdx = fullName.indexOf(',');
  if (commaIdx > 0) forms.push(fullName.substring(0, commaIdx).trim());
  return [...new Set(forms)];
}

const sortedNames = allSpecies
  .flatMap(s => getNameForms(s.name.trim()))
  .filter(n => n.length >= 4)
  .sort((a, b) => b.length - a.length);

console.log(`Toplam tür (kısa formlar dahil): ${sortedNames.length}`);

// variant.toLowerCase() → { replace: string } (kısa formdan geliyorsa kısa ismini yaz)
const nameVariantMap = new Map();

for (const s of allSpecies) {
  const full = s.name.trim();
  const forms = getNameForms(full);

  for (const form of forms) {
    // Bu formdan üretilen varyantlar, bu formla değiştirilmeli
    // (kısa form ise kısa isimle, tam form ise tam isimle)
    const variants = buildAllTurkishVariants(form);
    for (const v of variants) {
      const key = v.toLowerCase();
      if (!nameVariantMap.has(key)) {
        nameVariantMap.set(key, form);
      }
    }
  }
}

console.log(`Toplam varyant: ${nameVariantMap.size}`);

// En uzun varyant önce gelsin (kısmi eşleşmeleri önlemek için)
const sortedVariants = Array.from(nameVariantMap.keys())
  .sort((a, b) => b.length - a.length);

// ─── Metin düzeltme fonksiyonu ───────────────────────────────────────────────
function fixText(text) {
  if (!text) return text;
  let result = text;

  // Adım 1: Variant map üzerinden tam tür ismi eşleştirme
  for (const variant of sortedVariants) {
    if (!result.toLowerCase().includes(variant.toLowerCase())) continue;
    const original = nameVariantMap.get(variant.toLowerCase());
    const pattern = new RegExp(escapeRegex(variant), 'gi');
    result = result.replace(pattern, original);
  }

  // Adım 2: Hala kalan "TürkçeRenk/Sıfat + İngilizce balık tipi kelimesi" kombinasyonları
  // (fix-names-v2'nin yaptığı - tekrar uygula)
  const FISH_WORDS_EN = [
    'Tang', 'Wrasse', 'Goby', 'Blenny', 'Clown', 'Clownfish',
    'Damsel', 'Damselfish', 'Angelfish', 'Triggerfish', 'Trigger',
    'Dottyback', 'Anthias', 'Basslet', 'Hawk', 'Hawkfish', 'Grouper',
    'Chromis', 'Surgeonfish', 'Butterflyfish', 'Butterfly',
    'Jawfish', 'Lionfish', 'Cardinalfish', 'Cardinal', 'Goatfish',
    'Puffer', 'Pufferfish', 'Boxfish', 'Cowfish',
    'Eel', 'Moray', 'Parrotfish', 'Gramma', 'Assessor', 'Filefish',
  ];

  for (const [tr, en] of TR_TO_EN) {
    if (tr === 'Cerrah' || tr === 'Melek' || tr === 'Perisi') continue; // sadece fish tipi önünde değiştir
    for (const fishWord of FISH_WORDS_EN) {
      const pat = new RegExp(`\\b${escapeRegex(tr)}(?=[ -]${escapeRegex(fishWord)}(?:lar|ler)?\\b)`, 'g');
      result = result.replace(pat, en);
    }
  }

  // Adım 3: Kalan Türkçe balık tipi kelimeleri - basit global değiştirme
  // Bu kelimeler balık açıklamalarında neredeyse her zaman tür ismi bağlamında kullanılır
  const FISH_TYPE_DIRECT = [
    ['Cerrah Balığı', 'Surgeonfish'],
    ['Melek Balığı',  'Angelfish'],
    ['Kelebek Balığı','Butterflyfish'],
    ['Aslan Balığı',  'Lionfish'],
    ['Akrep Balığı',  'Scorpionfish'],
    ['Kardinal Balığı','Cardinalfish'],
    ['Çene Balığı',   'Jawfish'],
    ['Keçi Balığı',   'Goatfish'],
    ['Tetikçi Balığı','Triggerfish'],
    ['Papağan Balığı','Parrotfish'],
  ];

  for (const [tr, en] of FISH_TYPE_DIRECT) {
    result = result.replace(new RegExp(escapeRegex(tr), 'g'), en);
  }

  // Adım 4: Tang iyelik/çoğul ekleri
  // Not: 'ı' ASCII word char değil, \b yerine lookahead kullanıyoruz
  const notAlpha = '(?=[^a-zA-ZçğışöşüÇĞİÖŞÜ]|$)';
  result = result.replace(new RegExp(`Tang(?:ları|ların)${notAlpha}`, 'g'), 'Tangs');
  result = result.replace(new RegExp(`Tanglar${notAlpha}`, 'g'), 'Tangs');
  result = result.replace(new RegExp(`Tangın${notAlpha}`, 'g'), "Tang's");
  result = result.replace(new RegExp(`Tangı${notAlpha}`, 'g'), 'Tang');

  // Adım 5: "Perisi" → "Fairy" (Wrasse Perisi durumları)
  result = result.replace(/\bPerisi\b(?= Wrasse)/g, 'Fairy');
  result = result.replace(/\bPerisi\b(?='s)/g, 'Fairy');

  // Adım 6: Standalone "Cerrah" → "Surgeon" (sadece tür ismi bağlamında)
  // "Kırmızı Kuyruklu Cerrah" → "Redtail Surgeon" zaten varyantla yakalanmalı
  // Güvenlik için: Büyük harfli kelime + Cerrah kalıbını değiştir
  result = result.replace(
    /(?<=[A-ZÇĞİÖŞÜ][a-zçğışöşü]+ (?:[A-ZÇĞİÖŞÜ][a-zçğışöşü]+ )?)Cerrah(?=\b(?! Balığı))/g,
    'Surgeon'
  );

  return result;
}

// ─── Test ────────────────────────────────────────────────────────────────────
console.log('\n=== Testler ===');
const tests = [
  ['Çevik Chromis', 'Agile Chromis'],
  ['Alev Melek Balığı', 'Flame Angelfish'],
  ['Yarı Siyah Melek Balığı', 'Half Black Angelfish'],
  ['Gagalı Kelebek Balığı', null],           // Copperband → Gagalı çevirisi yok, kelebek kısmı düzelir
  ['Volitan Aslan Balığı', 'Volitan Lionfish'],
  ['Mavi Karayip Tangı', 'Blue Caribbean Tang'],
  ['Aşil Tangı', null],                      // Aşil = Achilles çevirisi yok → "Aşil Tang" olur
  ['Kırmızı Kuyruklu Cerrah', null],         // varyant olarak yakalanabilir
  ['Pijama Kardinal Balığı', 'Pajama Cardinalfish'],
  ['Mavi Boğaz Perisi Wrasse', 'Blue Throat Fairy Wrasse'],
  ['Sarı Tanglar sunmaktan', 'Yellow Tangs sunmaktan'],
];

for (const [input, expected] of tests) {
  const result = fixText(input);
  const ok = expected === null ? result !== input : result === expected;
  console.log(`  ${ok ? '✓' : '✗'} "${input}" → "${result}"${expected && !ok ? ` (beklenen: "${expected}")` : ''}`);
}

// ─── Veritabanı Güncelleme ───────────────────────────────────────────────────
console.log('\n=== Veritabanı Güncelleniyor ===');
const rows = db.prepare('SELECT id, description_tr, feeding_tr FROM species').all();
let updatedCount = 0;

const updateStmt = db.prepare(
  'UPDATE species SET description_tr = ?, feeding_tr = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
);

const changed = [];
for (const row of rows) {
  const newDesc = fixText(row.description_tr);
  const newFeed = fixText(row.feeding_tr);

  if (newDesc !== row.description_tr || newFeed !== row.feeding_tr) {
    updateStmt.run(newDesc, newFeed, row.id);
    updatedCount++;
    changed.push(row.id);
  }
}

console.log(`✓ Güncellenen tür: ${updatedCount}`);

// ─── Kontrol: Hala sorun var mı? ────────────────────────────────────────────
console.log('\n=== Kontrol ===');
const CHECK_PATTERNS = [
  'Cerrah Balığı', 'Melek Balığı', 'Kelebek Balığı', 'Aslan Balığı',
  'Akrep Balığı', 'Kardinal Balığı', 'Çene Balığı', 'Keçi Balığı',
  'Tangı', 'Tangın', 'Perisi Wrasse',
  'Çevik Chromis', 'Çevik',
];

let totalRemaining = 0;
for (const pattern of CHECK_PATTERNS) {
  // SQLite GLOB ile gerçek büyük harf eşleştirmesi
  const rows2 = db.prepare(
    "SELECT name FROM species WHERE description_tr GLOB ? OR feeding_tr GLOB ? LIMIT 3"
  ).all(`*${pattern}*`, `*${pattern}*`);
  if (rows2.length > 0) {
    console.log(`  ⚠ "${pattern}": ${rows2.map(r => r.name).join(', ')}`);
    totalRemaining += rows2.length;
  }
}

if (totalRemaining === 0) {
  console.log('  ✓ Tüm sorunlar giderildi!');
}
