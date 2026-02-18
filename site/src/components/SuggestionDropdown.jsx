import { CATEGORIES } from '../utils/translations';

export default function SuggestionDropdown({ suggestions, activeIndex, onSelect }) {
  if (!suggestions.length) return null;

  return (
    <ul className="search-suggestions" role="listbox">
      {suggestions.map((s, i) => {
        const cat = CATEGORIES[s.category] || {};
        return (
          <li
            key={s.id}
            role="option"
            aria-selected={i === activeIndex}
            className={`suggestion-item ${i === activeIndex ? 'active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault(); // blur'u tetiklemeden tıkla
              onSelect(s);
            }}
          >
            <span className="suggestion-icon">{cat.icon || '🌊'}</span>
            <span className="suggestion-text">
              <span className="suggestion-name">{s.name_tr || s.name}</span>
              {s.scientific_name && (
                <span className="suggestion-sci">{s.scientific_name}</span>
              )}
            </span>
            <span className="suggestion-cat">{cat.name_tr || s.category}</span>
          </li>
        );
      })}
    </ul>
  );
}
