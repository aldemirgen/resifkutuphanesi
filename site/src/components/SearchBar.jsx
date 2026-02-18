import { useNavigate } from 'react-router-dom';
import { UI_TEXT } from '../utils/translations';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import SuggestionDropdown from './SuggestionDropdown';

export default function SearchBar({ large = false }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    clearSuggestions();
    if (query.trim()) {
      navigate(`/arama?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form
      className={`search-bar ${large ? 'search-bar-large' : ''}`}
      onSubmit={handleSubmit}
      ref={wrapperRef}
      style={{ position: 'relative' }}
    >
      <div className="search-input-wrapper">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder={UI_TEXT.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, handleSubmit, navigate)}
          autoComplete="off"
        />
        <button type="submit">Ara</button>
      </div>

      {showSuggestions && (
        <SuggestionDropdown
          suggestions={suggestions}
          activeIndex={activeIndex}
          onSelect={(s) => selectSuggestion(s, navigate)}
        />
      )}
    </form>
  );
}
