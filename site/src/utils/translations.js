// Turkish translation dictionaries for LiveAquaria species data

export const CARE_LEVELS = {
  'Easy': 'Kolay',
  'Moderate': 'Orta',
  'Difficult': 'Zor',
  'Expert Only': 'Sadece Uzman',
  'Expert': 'Uzman',
};

export const TEMPERAMENTS = {
  'Peaceful': 'Barışçıl',
  'Semi-aggressive': 'Yarı Saldırgan',
  'Semi-Aggressive': 'Yarı Saldırgan',
  'Aggressive': 'Saldırgan',
  'Community Safe': 'Topluluk Güvenli',
};

export const DIETS = {
  'Omnivore': 'Hepçil',
  'Herbivore': 'Otçul',
  'Carnivore': 'Etçil',
  'Planktivore': 'Planktoncu',
  'Filter Feeder': 'Filtre Besleyici',
  'Photosynthetic': 'Fotosentetik',
};

export const REEF_COMPAT = {
  'Yes': 'Evet',
  'No': 'Hayır',
  'With Caution': 'Dikkatli Olunmalı',
  'Monitor': 'İzlenmeli',
};

export const CATEGORIES = {
  'marine-fish': {
    name: 'Marine Fish',
    name_tr: 'Deniz Balıkları',
    slug: 'marine-fish',
    icon: '🐠',
    description: 'Tuzlu su akvaryumları için deniz balığı türleri',
  },
  'corals': {
    name: 'Corals',
    name_tr: 'Mercanlar',
    slug: 'corals',
    icon: '🪸',
    description: 'SPS, LPS ve yumuşak mercan türleri',
  },
  'marine-invertebrates': {
    name: 'Marine Invertebrates',
    name_tr: 'Deniz Omurgasızları',
    slug: 'marine-invertebrates',
    icon: '🦐',
    description: 'Karides, yengeç, salyangoz ve diğer omurgasızlar',
  },
};

export const UI_TEXT = {
  siteName: 'Resif Kütüphanesi',
  heroTitle: 'Resif Kütüphanesi',
  heroSubtitle: 'Deniz balıkları, mercanlar ve omurgasızlar hakkında kapsamlı bakım rehberi',
  searchPlaceholder: 'Tür adı veya bilimsel isim ile arama...',
  categories: 'Kategoriler',
  allSpecies: 'Tüm Türler',
  totalSpecies: 'Toplam Tür',
  filters: 'Filtreler',
  careLevel: 'Bakım Seviyesi',
  temperament: 'Huy/Mizaç',
  diet: 'Beslenme',
  maxSize: 'Maksimum Boy',
  minTankSize: 'Minimum Akvaryum',
  reefCompatible: 'Resif Uyumlu',
  colorForm: 'Renk Formu',
  waterParams: 'Su Parametreleri',
  temperature: 'Sıcaklık',
  specificGravity: 'Özgül Ağırlık',
  description: 'Açıklama',
  feeding: 'Beslenme Bilgisi',
  scientificName: 'Bilimsel İsim',
  family: 'Aile',
  subcategory: 'Alt Kategori',
  similarSpecies: 'Benzer Türler',
  searchResults: 'Arama Sonuçları',
  noResults: 'Sonuç bulunamadı',
  sortBy: 'Sıralama',
  sortByName: 'İsme Göre',
  sortByCareLevel: 'Bakım Seviyesine Göre',
  sortBySize: 'Boya Göre',
  resetFilters: 'Filtreleri Temizle',
  home: 'Ana Sayfa',
  backToCategory: 'Kategoriye Dön',
  loading: 'Yükleniyor...',
  error: 'Bir hata oluştu',
  showingResults: 'sonuç gösteriliyor',
  footer: '© 2025 Resif Kütüphanesi | resifkutuphanesi.com',
  all: 'Tümü',
};

export function translateCareLevel(value) {
  return CARE_LEVELS[value] || value;
}

export function translateTemperament(value) {
  return TEMPERAMENTS[value] || value;
}

export function translateDiet(value) {
  return DIETS[value] || value;
}

export function translateReefCompat(value) {
  return REEF_COMPAT[value] || value;
}

export function getCategoryInfo(slug) {
  return CATEGORIES[slug] || { name: slug, name_tr: slug, slug, icon: '🌊' };
}
