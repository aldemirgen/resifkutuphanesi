import { useState, useEffect } from 'react';
import { UI_TEXT, CATEGORIES } from '../utils/translations';
import { loadAllData } from '../data';
import SearchBar from '../components/SearchBar';
import CategoryCard from '../components/CategoryCard';

export default function HomePage() {
  const [counts, setCounts] = useState({});
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadAllData().then((data) => {
      const c = {};
      let total = 0;
      for (const [slug, species] of Object.entries(data)) {
        c[slug] = species.length;
        total += species.length;
      }
      setCounts(c);
      setTotalCount(total);
    });
  }, []);

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">{UI_TEXT.heroTitle}</h1>
          <p className="hero-subtitle">{UI_TEXT.heroSubtitle}</p>
          <SearchBar large />
          {totalCount > 0 && (
            <p className="hero-stats">
              <span className="stat-number">{totalCount}</span> {UI_TEXT.totalSpecies}
            </p>
          )}
        </div>
        <div className="hero-decoration">
          <div className="bubble bubble-1"></div>
          <div className="bubble bubble-2"></div>
          <div className="bubble bubble-3"></div>
        </div>
      </section>

      <section className="categories-section">
        <h2>{UI_TEXT.categories}</h2>
        <div className="categories-grid">
          {Object.values(CATEGORIES).map((cat) => (
            <CategoryCard
              key={cat.slug}
              slug={cat.slug}
              name_tr={cat.name_tr}
              icon={cat.icon}
              description={cat.description}
              count={counts[cat.slug] || 0}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
