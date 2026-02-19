import { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import SpeciesForm from '../../components/admin/SpeciesForm';
import AdminHeader from '../../components/admin/AdminHeader';
import './admin.css';

function AdminSpeciesEditPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [species, setSpecies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // List context passed from AdminSpeciesListPage via Link state
  const listContext = location.state || null;
  const { ids = [], index = -1, page = 1, category = '', search = '' } = listContext || {};

  const hasPrev = listContext && index > 0;
  const hasNext = listContext && index < ids.length - 1;
  const prevId = hasPrev ? ids[index - 1] : null;
  const nextId = hasNext ? ids[index + 1] : null;

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setSpecies(null);
    fetch(`/api/species/${id}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) { setSpecies(data); setLoading(false); }
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  async function handleSubmit(payload) {
    const token = localStorage.getItem('admin_token');
    const resp = await fetch(`/api/species/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || 'Güncelleme başarısız');
    }

    const updated = await resp.json();
    setSpecies(updated);
    setSuccessMsg('Kaydedildi!');
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  async function handleSubmitAndNext(payload) {
    await handleSubmit(payload);
    if (hasNext) {
      navigate(`/admin/tur/${nextId}`, {
        state: { ids, index: index + 1, page, category, search },
      });
    }
  }

  function buildListUrl() {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return `/admin/tur${qs ? '?' + qs : ''}`;
  }

  return (
    <div className="admin-layout">
      <AdminHeader />

      <main className="admin-main">
        <div className="admin-page-header">
          <div>
            <div className="admin-breadcrumb">
              <Link to={buildListUrl()}>Türler</Link>
              <span> / </span>
              <span>Düzenle</span>
            </div>
            <h2>Tür Düzenle</h2>
          </div>

          {listContext && (
            <div className="admin-species-nav">
              <button
                className="admin-btn admin-btn-outline admin-btn-sm"
                disabled={!hasPrev}
                onClick={() => navigate(`/admin/tur/${prevId}`, {
                  state: { ids, index: index - 1, page, category, search },
                })}
              >
                ← Önceki
              </button>
              <span className="admin-species-nav-position">
                {index + 1} / {ids.length}
              </span>
              <button
                className="admin-btn admin-btn-outline admin-btn-sm"
                disabled={!hasNext}
                onClick={() => navigate(`/admin/tur/${nextId}`, {
                  state: { ids, index: index + 1, page, category, search },
                })}
              >
                Sonraki →
              </button>
            </div>
          )}
        </div>

        {loading && <div className="admin-loading">Yükleniyor...</div>}
        {notFound && <div className="admin-error">Tür bulunamadı: {id}</div>}
        {successMsg && <div className="admin-success">{successMsg}</div>}

        {species && (
          <>
            <div className="admin-species-meta">
              <span>ID: <code>{species.id}</code></span>
              {species.updated_at && (
                <span>Son güncelleme: {new Date(species.updated_at).toLocaleString('tr-TR')}</span>
              )}
              <Link to={`/tur/${species.id}`} target="_blank" className="admin-btn admin-btn-outline admin-btn-sm">
                Siteyi Görüntüle ↗
              </Link>
            </div>
            <SpeciesForm
              initialData={species}
              onSubmit={handleSubmit}
              onSubmitAndNext={hasNext ? handleSubmitAndNext : null}
              submitLabel="Güncelle"
            />
          </>
        )}
      </main>
    </div>
  );
}

export default AdminSpeciesEditPage;
