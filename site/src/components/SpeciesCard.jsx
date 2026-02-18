import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function SpeciesCard({ species }) {
  const [imgError, setImgError] = useState(false);

  const careLevelClass = {
    'Easy': 'care-easy',
    'Moderate': 'care-moderate',
    'Difficult': 'care-difficult',
    'Expert Only': 'care-expert',
    'Expert': 'care-expert',
  }[species.care_level] || '';

  return (
    <Link to={`/tur/${species.id}`} className="species-card">
      <div className="species-card-image">
        {species.image_url && !imgError ? (
          <img
            src={species.image_url}
            alt={species.name}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="species-card-placeholder">
            {species.category === 'corals' ? '🪸' : species.category === 'marine-invertebrates' ? '🦐' : '🐠'}
          </div>
        )}
      </div>
      <div className="species-card-info">
        <h3 className="species-card-name">{species.name_tr || species.name}</h3>
        <p className="species-card-scientific">{species.scientific_name}</p>
        <div className="species-card-tags">
          {species.care_level && (
            <span className={`tag ${careLevelClass}`}>
              {species.care_level_tr || species.care_level}
            </span>
          )}
          {species.temperament && (
            <span className="tag tag-temperament">
              {species.temperament_tr || species.temperament}
            </span>
          )}
        </div>
        {species.max_size && (
          <p className="species-card-size">Max: {species.max_size}</p>
        )}
      </div>
    </Link>
  );
}
