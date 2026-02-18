import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UI_TEXT } from '../utils/translations';

export default function SearchBar({ large = false }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/arama?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form className={`search-bar ${large ? 'search-bar-large' : ''}`} onSubmit={handleSearch}>
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
        />
        <button type="submit">Ara</button>
      </div>
    </form>
  );
}
