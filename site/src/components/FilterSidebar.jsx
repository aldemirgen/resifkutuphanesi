import { UI_TEXT } from '../utils/translations';

export default function FilterSidebar({
  filters,
  onFilterChange,
  subcategories = [],
  careLevels = [],
  temperaments = [],
  reefOptions = [],
}) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value === filters[key] ? '' : value });
  };

  const handleReset = () => {
    onFilterChange({
      careLevel: '',
      temperament: '',
      reefCompatible: '',
      subcategory: '',
      diet: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  return (
    <aside className="filter-sidebar">
      <div className="filter-header">
        <h3>{UI_TEXT.filters}</h3>
        {hasActiveFilters && (
          <button className="filter-reset" onClick={handleReset}>
            {UI_TEXT.resetFilters}
          </button>
        )}
      </div>

      {subcategories.length > 0 && (
        <div className="filter-group">
          <h4>{UI_TEXT.subcategory}</h4>
          <div className="filter-options">
            {subcategories.map((sub) => (
              <button
                key={sub}
                className={`filter-btn ${filters.subcategory === sub ? 'active' : ''}`}
                onClick={() => handleChange('subcategory', sub)}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {careLevels.length > 0 && (
        <div className="filter-group">
          <h4>{UI_TEXT.careLevel}</h4>
          <div className="filter-options">
            {careLevels.map((level) => (
              <button
                key={level}
                className={`filter-btn ${filters.careLevel === level ? 'active' : ''}`}
                onClick={() => handleChange('careLevel', level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}

      {temperaments.length > 0 && (
        <div className="filter-group">
          <h4>{UI_TEXT.temperament}</h4>
          <div className="filter-options">
            {temperaments.map((temp) => (
              <button
                key={temp}
                className={`filter-btn ${filters.temperament === temp ? 'active' : ''}`}
                onClick={() => handleChange('temperament', temp)}
              >
                {temp}
              </button>
            ))}
          </div>
        </div>
      )}

      {reefOptions.length > 0 && (
        <div className="filter-group">
          <h4>{UI_TEXT.reefCompatible}</h4>
          <div className="filter-options">
            {reefOptions.map((opt) => (
              <button
                key={opt}
                className={`filter-btn ${filters.reefCompatible === opt ? 'active' : ''}`}
                onClick={() => handleChange('reefCompatible', opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
