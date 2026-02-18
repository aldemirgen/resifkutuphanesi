import { useState } from 'react';

const CARE_LEVELS = ['Easy', 'Moderate', 'Difficult', 'Expert Only'];
const TEMPERAMENTS = ['Peaceful', 'Semi-Aggressive', 'Aggressive'];
const DIETS = ['Carnivore', 'Herbivore', 'Omnivore', 'Planktivore', 'Coral'];
const REEF_COMPAT = ['Yes', 'No', 'With Caution'];
const CATEGORIES = [
  { value: 'marine-fish', label: 'Deniz Balıkları' },
  { value: 'corals', label: 'Mercanlar' },
  { value: 'marine-invertebrates', label: 'Deniz Omurgasızları' },
];

// Fields that can be manually edited (tracked in manually_edited_fields)
const TRACKABLE_FIELDS = [
  'name_tr', 'care_level_tr', 'temperament_tr', 'diet_tr',
  'reef_compatible_tr', 'description_tr', 'feeding_tr',
  'description', 'feeding',
];

function SpeciesForm({ initialData = {}, onSubmit, submitLabel = 'Kaydet', isNew = false }) {
  const [form, setForm] = useState({
    id: initialData.id || '',
    category: initialData.category || 'marine-fish',
    subcategory: initialData.subcategory || '',
    name: initialData.name || '',
    name_tr: initialData.name_tr || '',
    scientific_name: initialData.scientific_name || '',
    family: initialData.family || '',
    care_level: initialData.care_level || '',
    care_level_tr: initialData.care_level_tr || '',
    temperament: initialData.temperament || '',
    temperament_tr: initialData.temperament_tr || '',
    diet: initialData.diet || '',
    diet_tr: initialData.diet_tr || '',
    max_size: initialData.max_size || '',
    min_tank_size: initialData.min_tank_size || '',
    reef_compatible: initialData.reef_compatible || '',
    reef_compatible_tr: initialData.reef_compatible_tr || '',
    color_form: initialData.color_form || '',
    description: initialData.description || '',
    description_tr: initialData.description_tr || '',
    feeding: initialData.feeding || '',
    feeding_tr: initialData.feeding_tr || '',
    image_url: initialData.image_url || '',
  });

  const [editedFields, setEditedFields] = useState(
    Array.isArray(initialData.manually_edited_fields)
      ? initialData.manually_edited_fields
      : []
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (TRACKABLE_FIELDS.includes(field)) {
      // Mark field as manually edited
      setEditedFields((prev) =>
        prev.includes(field) ? prev : [...prev, field]
      );
    }
  }

  function toggleManualField(field) {
    setEditedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = { ...form, manually_edited_fields: editedFields };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Kaydetme hatası');
    } finally {
      setSaving(false);
    }
  }

  function fieldLabel(field, label) {
    const isEdited = editedFields.includes(field);
    return (
      <label>
        {label}
        {TRACKABLE_FIELDS.includes(field) && (
          <button
            type="button"
            className={`admin-field-toggle ${isEdited ? 'active' : ''}`}
            onClick={() => toggleManualField(field)}
            title={isEdited ? 'Manuel korumalı - kaldırmak için tıkla' : 'Manuel koruma ekle'}
          >
            {isEdited ? '🔒' : '🔓'}
          </button>
        )}
      </label>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="admin-species-form">
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-form-section">
        <h3>Temel Bilgiler</h3>
        <div className="admin-form-grid">
          {isNew && (
            <div className="admin-form-group">
              <label>ID (benzersiz)</label>
              <input
                type="text"
                value={form.id}
                onChange={(e) => handleChange('id', e.target.value)}
                required
                placeholder="ornek: clownfish-ocellaris"
              />
            </div>
          )}

          <div className="admin-form-group">
            <label>Kategori</label>
            <select
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              required
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label>Alt Kategori</label>
            <input
              type="text"
              value={form.subcategory}
              onChange={(e) => handleChange('subcategory', e.target.value)}
            />
          </div>

          <div className="admin-form-group">
            <label>İngilizce İsim</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div className="admin-form-group">
            {fieldLabel('name_tr', 'Türkçe İsim')}
            <input
              type="text"
              value={form.name_tr}
              onChange={(e) => handleChange('name_tr', e.target.value)}
            />
          </div>

          <div className="admin-form-group">
            <label>Bilimsel Ad</label>
            <input
              type="text"
              value={form.scientific_name}
              onChange={(e) => handleChange('scientific_name', e.target.value)}
            />
          </div>

          <div className="admin-form-group">
            <label>Aile</label>
            <input
              type="text"
              value={form.family}
              onChange={(e) => handleChange('family', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-form-section">
        <h3>Bakım Özellikleri</h3>
        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label>Bakım Seviyesi (EN)</label>
            <select
              value={form.care_level}
              onChange={(e) => handleChange('care_level', e.target.value)}
            >
              <option value="">Seçiniz</option>
              {CARE_LEVELS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="admin-form-group">
            {fieldLabel('care_level_tr', 'Bakım Seviyesi (TR)')}
            <input
              type="text"
              value={form.care_level_tr}
              onChange={(e) => handleChange('care_level_tr', e.target.value)}
            />
          </div>

          <div className="admin-form-group">
            <label>Huyu (EN)</label>
            <select
              value={form.temperament}
              onChange={(e) => handleChange('temperament', e.target.value)}
            >
              <option value="">Seçiniz</option>
              {TEMPERAMENTS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="admin-form-group">
            {fieldLabel('temperament_tr', 'Huyu (TR)')}
            <input
              type="text"
              value={form.temperament_tr}
              onChange={(e) => handleChange('temperament_tr', e.target.value)}
            />
          </div>

          <div className="admin-form-group">
            <label>Beslenme (EN)</label>
            <select
              value={form.diet}
              onChange={(e) => handleChange('diet', e.target.value)}
            >
              <option value="">Seçiniz</option>
              {DIETS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="admin-form-group">
            {fieldLabel('diet_tr', 'Beslenme (TR)')}
            <input
              type="text"
              value={form.diet_tr}
              onChange={(e) => handleChange('diet_tr', e.target.value)}
            />
          </div>

          <div className="admin-form-group">
            <label>Resif Uyumlu (EN)</label>
            <select
              value={form.reef_compatible}
              onChange={(e) => handleChange('reef_compatible', e.target.value)}
            >
              <option value="">Seçiniz</option>
              {REEF_COMPAT.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="admin-form-group">
            {fieldLabel('reef_compatible_tr', 'Resif Uyumlu (TR)')}
            <input
              type="text"
              value={form.reef_compatible_tr}
              onChange={(e) => handleChange('reef_compatible_tr', e.target.value)}
            />
          </div>

          <div className="admin-form-group">
            <label>Maksimum Boy</label>
            <input
              type="text"
              value={form.max_size}
              onChange={(e) => handleChange('max_size', e.target.value)}
              placeholder='örn: 3"'
            />
          </div>

          <div className="admin-form-group">
            <label>Min. Akvaryum (Galon)</label>
            <input
              type="text"
              value={form.min_tank_size}
              onChange={(e) => handleChange('min_tank_size', e.target.value)}
              placeholder='örn: 30 gallons'
            />
          </div>

          <div className="admin-form-group">
            <label>Renk Formu</label>
            <input
              type="text"
              value={form.color_form}
              onChange={(e) => handleChange('color_form', e.target.value)}
            />
          </div>

          <div className="admin-form-group admin-form-group-full">
            <label>Görsel URL</label>
            <div className="admin-image-field">
              <input
                type="text"
                value={form.image_url}
                onChange={(e) => handleChange('image_url', e.target.value)}
                placeholder="/images/marine-fish/example.jpg"
              />
              {form.image_url && (
                <div className="admin-image-preview">
                  <img
                    src={form.image_url}
                    alt="Önizleme"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    onLoad={(e) => { e.target.style.display = 'block'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'none'; }}
                  />
                  <div className="admin-image-error" style={{ display: 'none' }}>
                    Görsel yüklenemedi
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-form-section">
        <h3>Açıklama ve Beslenme</h3>

        <div className="admin-form-group admin-form-group-full">
          {fieldLabel('description', 'Açıklama (EN)')}
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={5}
          />
        </div>

        <div className="admin-form-group admin-form-group-full">
          {fieldLabel('description_tr', 'Açıklama (TR)')}
          <textarea
            value={form.description_tr}
            onChange={(e) => handleChange('description_tr', e.target.value)}
            rows={5}
          />
        </div>

        <div className="admin-form-group admin-form-group-full">
          {fieldLabel('feeding', 'Beslenme Notları (EN)')}
          <textarea
            value={form.feeding}
            onChange={(e) => handleChange('feeding', e.target.value)}
            rows={3}
          />
        </div>

        <div className="admin-form-group admin-form-group-full">
          {fieldLabel('feeding_tr', 'Beslenme Notları (TR)')}
          <textarea
            value={form.feeding_tr}
            onChange={(e) => handleChange('feeding_tr', e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {editedFields.length > 0 && (
        <div className="admin-edited-fields-summary">
          <strong>Manuel Korunan Alanlar:</strong>{' '}
          {editedFields.join(', ')}
          <span className="admin-edited-note">
            (Bu alanlar scraper merge işleminde korunacak)
          </span>
        </div>
      )}

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
          {saving ? 'Kaydediliyor...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default SpeciesForm;
