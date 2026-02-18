import { Link } from 'react-router-dom';

export default function CategoryCard({ slug, name_tr, icon, description, count }) {
  return (
    <Link to={`/kategori/${slug}`} className="category-card">
      <div className="category-card-icon">{icon}</div>
      <h3 className="category-card-title">{name_tr}</h3>
      <p className="category-card-desc">{description}</p>
      <span className="category-card-count">{count} tür</span>
    </Link>
  );
}
