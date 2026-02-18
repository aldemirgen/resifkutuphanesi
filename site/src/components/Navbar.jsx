import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { UI_TEXT } from '../utils/translations';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
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

        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" aria-label="Ara">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </form>
      </div>
    </nav>
  );
}
