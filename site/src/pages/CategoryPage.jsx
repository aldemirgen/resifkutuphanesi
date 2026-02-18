import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UI_TEXT, getCategoryInfo } from '../utils/translations';
import {
  loadCategoryData,
  filterSpecies,
  sortSpecies,
  getSubcategories,
  getUniqueValues,
} from '../data';
import SpeciesCard from '../components/SpeciesCard';
import FilterSidebar from '../components/FilterSidebar';

export default function CategoryPage() {
  const { slug } = useParams();
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [filters, setFilters] = useState({
    careLevel: '',
    temperament: '',
    reefCompatible: '',
    subcategory: '',
    diet: '',
  });

  const categoryInfo = getCategoryInfo(slug);

  useEffect(() => {
    setLoading(true);
    loadCategoryData(slug).then((data) => {
      setSpecies(data);
      setLoading(false);
    });
    setFilters({
      careLevel: '',
      temperament: '',
      reefCompatible: '',
      subcategory: '',
      diet: '',
    });
  }, [slug]);

  const subcategories = useMemo(() => getSubcategories(species), [species]);
  const careLevels = useMemo(() => getUniqueValues(species, 'care_level'), [species]);
  const temperaments = useMemo(() => getUniqueValues(species, 'temperament'), [species]);
  const reefOptions = useMemo(() => getUniqueValues(species, 'reef_compatible'), [species]);

  const filteredAndSorted = useMemo(() => {
    const filtered = filterSpecies(species, filters);
    return sortSpecies(filtered, sortBy);
  }, [species, filters, sortBy]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>{UI_TEXT.loading}</p>
      </div>
    );
  }

  return (
    <div className="category-page">
      <div className="category-header">
        <div className="category-breadcrumb">
          <Link to="/">{UI_TEXT.home}</Link>
          <span className="breadcrumb-sep">/</span>
          <span>{categoryInfo.name_tr}</span>
        </div>
        <h1>
          <span className="category-icon">{categoryInfo.icon}</span>
          {categoryInfo.name_tr}
        </h1>
        <p className="category-count">
          {filteredAndSorted.length} / {species.length} {UI_TEXT.showingResults}
        </p>
      </div>

      <div className="category-layout">
        <FilterSidebar
          filters={filters}
          onFilterChange={setFilters}
          subcategories={subcategories}
          careLevels={careLevels}
          temperaments={temperaments}
          reefOptions={reefOptions}
        />

        <div className="category-content">
          <div className="sort-bar">
            <label>{UI_TEXT.sortBy}:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">{UI_TEXT.sortByName}</option>
              <option value="care_level">{UI_TEXT.sortByCareLevel}</option>
              <option value="max_size">{UI_TEXT.sortBySize}</option>
            </select>
          </div>

          {filteredAndSorted.length === 0 ? (
            <div className="no-results">
              <p>{UI_TEXT.noResults}</p>
            </div>
          ) : (
            <div className="species-grid">
              {filteredAndSorted.map((s) => (
                <SpeciesCard key={s.id} species={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
