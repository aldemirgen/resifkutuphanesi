import { Link, useNavigate } from 'react-router-dom';
import { UI_TEXT } from '../utils/translations';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import SuggestionDropdown from './SuggestionDropdown';

export default function Navbar() {
  const navigate = useNavigate();
  const {
    query,
    setQuery,
    suggestions,
    showSuggestions,
    activeIndex,
    wrapperRef,
    handleKeyDown,
    selectSuggestion,
    clearSuggestions,
  } = useSearchSuggestions();

  const handleSearch = (e) => {
    e.preventDefault();
    clearSuggestions();
    if (query.trim()) {
      navigate(`/arama?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-icon">🌊</span>
          <span className="navbar-title">{UI_TEXT.siteName}</span>
        </Link>

        <div className="navbar-links">
          <Link to="/kategori/marine-fish">Deniz Balıkları</Link>
          <Link to="/kategori/corals">Mercanlar</Link>
          <Link to="/kategori/marine-invertebrates">Omurgasızlar</Link>
        </div>

        <form className="navbar-search" onSubmit={handleSearch} ref={wrapperRef} style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleSearch, navigate)}
            autoComplete="off"
          />
          <button type="submit" aria-label="Ara">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          {showSuggestions && (
            <SuggestionDropdown
              suggestions={suggestions}
              activeIndex={activeIndex}
              onSelect={(s) => selectSuggestion(s, navigate)}
            />
          )}
        </form>
      </div>
    </nav>
  );
}
