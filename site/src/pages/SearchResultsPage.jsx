import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UI_TEXT } from '../utils/translations';
import { getAllSpecies, searchSpecies } from '../data';
import SpeciesCard from '../components/SpeciesCard';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAllSpecies().then((allSpecies) => {
      const found = searchSpecies(allSpecies, query);
      setResults(found);
      setLoading(false);
    });
  }, [query]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>{UI_TEXT.loading}</p>
      </div>
    );
  }

  return (
    <div className="search-results-page">
      <div className="search-results-header">
        <h1>{UI_TEXT.searchResults}</h1>
        <p>
          "{query}" - <strong>{results.length}</strong> {UI_TEXT.showingResults}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <p>{UI_TEXT.noResults}</p>
          <p className="no-results-hint">Farklı bir arama terimi deneyin.</p>
        </div>
      ) : (
        <div className="species-grid">
          {results.map((s) => (
            <SpeciesCard key={s.id} species={s} />
          ))}
        </div>
      )}
    </div>
  );
}
