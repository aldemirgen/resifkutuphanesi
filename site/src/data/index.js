// Data loading and helper functions
// Uses /api/species endpoint instead of static JSON files

let dataCache = {};

export async function loadCategoryData(slug) {
  if (dataCache[slug]) return dataCache[slug];

  try {
    const resp = await fetch(`/api/species?category=${slug}&limit=9999`);
    if (!resp.ok) throw new Error(`Failed to load ${slug}`);
    const data = await resp.json();
    dataCache[slug] = data;
    return data;
  } catch (e) {
    console.error(`Error loading data for ${slug}:`, e);
    return [];
  }
}

export function clearCache(slug) {
  if (slug) {
    delete dataCache[slug];
  } else {
    dataCache = {};
  }
}

export async function loadAllData() {
  const slugs = ['marine-fish', 'corals', 'marine-invertebrates'];
  const results = {};
  await Promise.all(
    slugs.map(async (slug) => {
      results[slug] = await loadCategoryData(slug);
    })
  );
  return results;
}

export async function getAllSpecies() {
  const all = await loadAllData();
  return [
    ...(all['marine-fish'] || []),
    ...(all['corals'] || []),
    ...(all['marine-invertebrates'] || []),
  ];
}

export function searchSpecies(speciesList, query) {
  if (!query || !query.trim()) return speciesList;
  const q = query.toLowerCase().trim();
  return speciesList.filter((s) => {
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.name_tr && s.name_tr.toLowerCase().includes(q)) ||
      (s.scientific_name && s.scientific_name.toLowerCase().includes(q)) ||
      (s.family && s.family.toLowerCase().includes(q)) ||
      (s.subcategory && s.subcategory.toLowerCase().includes(q))
    );
  });
}

export function filterSpecies(speciesList, filters) {
  return speciesList.filter((s) => {
    if (filters.careLevel && s.care_level !== filters.careLevel) return false;
    if (filters.temperament && s.temperament !== filters.temperament) return false;
    if (filters.reefCompatible && s.reef_compatible !== filters.reefCompatible) return false;
    if (filters.subcategory && s.subcategory !== filters.subcategory) return false;
    if (filters.diet && s.diet !== filters.diet) return false;
    return true;
  });
}

export function sortSpecies(speciesList, sortBy) {
  const sorted = [...speciesList];
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'name_tr':
      return sorted.sort((a, b) => (a.name_tr || '').localeCompare(b.name_tr || ''));
    case 'care_level': {
      const order = { 'Kolay': 1, 'Orta': 2, 'Zor': 3, 'Sadece Uzman': 4, 'Uzman': 4 };
      return sorted.sort((a, b) => (order[a.care_level] || 5) - (order[b.care_level] || 5));
    }
    case 'max_size': {
      const parseSize = (s) => {
        const match = s && s.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 999;
      };
      return sorted.sort((a, b) => parseSize(a.max_size) - parseSize(b.max_size));
    }
    default:
      return sorted;
  }
}

export function getSubcategories(speciesList) {
  const subcats = new Set();
  speciesList.forEach((s) => {
    if (s.subcategory) subcats.add(s.subcategory);
  });
  return Array.from(subcats).sort();
}

export function getUniqueValues(speciesList, field) {
  const values = new Set();
  speciesList.forEach((s) => {
    if (s[field]) values.add(s[field]);
  });
  return Array.from(values).sort();
}

export function getSimilarSpecies(species, allSpecies, limit = 6) {
  return allSpecies
    .filter((s) => {
      if (s.id === species.id) return false;
      return (
        s.category === species.category &&
        (s.subcategory === species.subcategory || s.family === species.family)
      );
    })
    .slice(0, limit);
}

export function getSpeciesById(allSpecies, id) {
  return allSpecies.find((s) => s.id === id || s.id === String(id));
}

export async function getSpeciesByIdFromApi(id) {
  try {
    const resp = await fetch(`/api/species/${id}`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    console.error(`Error loading species ${id}:`, e);
    return null;
  }
}
