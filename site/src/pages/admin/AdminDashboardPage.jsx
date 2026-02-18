import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminHeader from '../../components/admin/AdminHeader';
import './admin.css';

const CATEGORY_LABELS = {
  'marine-fish': 'Deniz Balıkları',
  'corals': 'Mercanlar',
  'marine-invertebrates': 'Deniz Omurgasızları',
};

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="admin-layout">
      <AdminHeader />

      <main className="admin-main">
        <div className="admin-page-header">
          <h2>Dashboard</h2>
          <Link to="/admin/tur/yeni" className="admin-btn admin-btn-primary">
            + Yeni Tür Ekle
          </Link>
        </div>

        {loading ? (
          <div className="admin-loading">Yükleniyor...</div>
        ) : (
          <>
            <div className="admin-stats-grid">
              <div className="admin-stat-card admin-stat-total">
                <div className="admin-stat-number">{stats?.total || 0}</div>
                <div className="admin-stat-label">Toplam Tür</div>
              </div>
              {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
                <div key={slug} className="admin-stat-card">
                  <div className="admin-stat-number">
                    {stats?.byCategory?.[slug] || 0}
                  </div>
                  <div className="admin-stat-label">{label}</div>
                  <Link to={`/admin/tur?category=${slug}`} className="admin-stat-link">
                    Görüntüle →
                  </Link>
                </div>
              ))}
            </div>

            <div className="admin-category-cards">
              <h3>Kategoriler</h3>
              <div className="admin-card-grid">
                {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
                  <Link key={slug} to={`/admin/tur?category=${slug}`} className="admin-category-card">
                    <h4>{label}</h4>
                    <p>{stats?.byCategory?.[slug] || 0} tür</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="admin-quick-links">
              <h3>Hızlı Erişim</h3>
              <div className="admin-links-row">
                <Link to="/admin/tur" className="admin-btn admin-btn-secondary">
                  Tüm Türleri Listele
                </Link>
                <Link to="/admin/tur/yeni" className="admin-btn admin-btn-primary">
                  Yeni Tür Ekle
                </Link>
                <Link to="/" target="_blank" className="admin-btn admin-btn-outline">
                  Siteyi Görüntüle ↗
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboardPage;
