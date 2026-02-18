import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UI_TEXT, getCategoryInfo } from '../utils/translations';
import SpeciesCard from './SpeciesCard';

function formatTextToParagraphs(text) {
  if (!text) return [];
  // Split on sentence endings followed by a capital letter or end of string
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [text];
  const cleaned = sentences.map((s) => s.trim()).filter(Boolean);
  // Group every 3 sentences into a paragraph
  const paragraphs = [];
  for (let i = 0; i < cleaned.length; i += 3) {
    paragraphs.push(cleaned.slice(i, i + 3).join(' '));
  }
  return paragraphs;
}

export default function SpeciesDetail({ species, similarSpecies = [] }) {
  const [imgError, setImgError] = useState(false);
  const categoryInfo = getCategoryInfo(species.category);

  const infoItems = [
    { label: UI_TEXT.careLevel, value: species.care_level_tr || species.care_level, icon: '🔧' },
    { label: UI_TEXT.temperament, value: species.temperament_tr || species.temperament, icon: '😊' },
    { label: UI_TEXT.diet, value: species.diet_tr || species.diet, icon: '🍽️' },
    { label: UI_TEXT.maxSize, value: species.max_size, icon: '📏' },
    { label: UI_TEXT.minTankSize, value: species.min_tank_size, icon: '🏠' },
    { label: UI_TEXT.reefCompatible, value: species.reef_compatible_tr || species.reef_compatible, icon: '🪸' },
    { label: UI_TEXT.colorForm, value: species.color_form, icon: '🎨' },
    { label: UI_TEXT.family, value: species.family, icon: '🧬' },
  ].filter((item) => item.value);

  const waterParams = species.water_params || {};
  const hasWaterParams = waterParams.temperature || waterParams.sg || waterParams.ph || waterParams.dkh;

  return (
    <div className="species-detail">
      <div className="species-detail-breadcrumb">
        <Link to="/">{UI_TEXT.home}</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/kategori/${species.category}`}>{categoryInfo.name_tr}</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{species.name_tr || species.name}</span>
      </div>

      <div className="species-detail-header">
        <div className="species-detail-image">
          {species.image_url && !imgError ? (
            <img
              src={species.image_url}
              alt={species.name}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="species-detail-placeholder">
              {categoryInfo.icon}
            </div>
          )}
        </div>

        <div className="species-detail-names">
          <h1>{species.name_tr || species.name}</h1>
          {species.name_tr && species.name_tr !== species.name && (
            <h2 className="species-english-name">{species.name}</h2>
          )}
          {species.scientific_name && (
            <p className="species-scientific">
              <em>{species.scientific_name}</em>
            </p>
          )}
          {species.subcategory && (
            <span className="species-subcategory-badge">{species.subcategory}</span>
          )}
        </div>
      </div>

      <div className="species-detail-grid">
        {infoItems.map((item) => (
          <div key={item.label} className="info-card">
            <span className="info-card-icon">{item.icon}</span>
            <div>
              <span className="info-card-label">{item.label}</span>
              <span className="info-card-value">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {hasWaterParams && (
        <div className="species-detail-section">
          <h3>{UI_TEXT.waterParams}</h3>
          <div className="water-params-table">
            {waterParams.temperature && (
              <div className="water-param">
                <span className="water-param-label">{UI_TEXT.temperature}</span>
                <span className="water-param-value">{waterParams.temperature}</span>
              </div>
            )}
            {waterParams.sg && (
              <div className="water-param">
                <span className="water-param-label">{UI_TEXT.specificGravity} (SG)</span>
                <span className="water-param-value">{waterParams.sg}</span>
              </div>
            )}
            {waterParams.ph && (
              <div className="water-param">
                <span className="water-param-label">pH</span>
                <span className="water-param-value">{waterParams.ph}</span>
              </div>
            )}
            {waterParams.dkh && (
              <div className="water-param">
                <span className="water-param-label">dKH</span>
                <span className="water-param-value">{waterParams.dkh}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {(species.description_tr || species.description) && (
        <div className="species-detail-section">
          <h3>{UI_TEXT.description}</h3>
          <div className="species-description-text">
            {formatTextToParagraphs(species.description_tr || species.description).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      )}

      {(species.feeding_tr || species.feeding) && (
        <div className="species-detail-section">
          <h3>{UI_TEXT.feeding}</h3>
          <div className="species-feeding-text">
            {formatTextToParagraphs(species.feeding_tr || species.feeding).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      )}

      {similarSpecies.length > 0 && (
        <div className="species-detail-section">
          <h3>{UI_TEXT.similarSpecies}</h3>
          <div className="species-grid similar-grid">
            {similarSpecies.map((s) => (
              <SpeciesCard key={s.id} species={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
