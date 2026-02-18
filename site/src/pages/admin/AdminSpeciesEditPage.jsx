import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import SpeciesForm from '../../components/admin/SpeciesForm';
import AdminHeader from '../../components/admin/AdminHeader';
import './admin.css';

function AdminSpeciesEditPage() {
  const { id } = useParams();
  const [species, setSpecies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
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

  return (
    <div className="admin-layout">
      <AdminHeader />

      <main className="admin-main">
        <div className="admin-page-header">
          <div>
            <div className="admin-breadcrumb">
              <Link to="/admin/tur">Türler</Link>
              <span> / </span>
              <span>Düzenle</span>
            </div>
            <h2>Tür Düzenle</h2>
          </div>
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
              submitLabel="Güncelle"
            />
          </>
        )}
      </main>
    </div>
  );
}

export default AdminSpeciesEditPage;
