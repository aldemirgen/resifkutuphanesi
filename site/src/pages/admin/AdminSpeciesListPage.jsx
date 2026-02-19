import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminHeader from '../../components/admin/AdminHeader';
import './admin.css';

const CATEGORY_LABELS = {
  '': 'Tüm Kategoriler',
  'marine-fish': 'Deniz Balıkları',
  'corals': 'Mercanlar',
  'marine-invertebrates': 'Deniz Omurgasızları',
};

const PAGE_SIZE = 50;

const SORTABLE_COLUMNS = [
  { key: 'name_tr',         label: 'Türkçe İsim' },
  { key: 'name',            label: 'İngilizce İsim' },
  { key: 'scientific_name', label: 'Bilimsel Ad' },
  { key: 'category',        label: 'Kategori' },
  { key: 'care_level',      label: 'Bakım' },
];

function AdminSpeciesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allSpecies, setAllSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchInput, setSearchInput] = useState('');

  // Sort state
  const [sortKey, setSortKey] = useState('name_tr');
  const [sortDir, setSortDir] = useState('asc');

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  // Pagination — kept in URL so edit→back preserves position
  const page = parseInt(searchParams.get('page') || '1', 10);

  function setPage(newPage) {
    const params = {};
    if (category) params.category = category;
    if (search) params.search = search;
    if (newPage > 1) params.page = String(newPage);
    setSearchParams(params);
  }

  const fetchSpecies = useCallback(() => {
    setLoading(true);
    let url = '/api/species?limit=9999';
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setAllSpecies(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, search]);

  useEffect(() => { fetchSpecies(); }, [fetchSpecies]);
  useEffect(() => { setSearchInput(search); }, [search]);

  function handleCategoryChange(cat) {
    const params = {};
    if (cat) params.category = cat;
    if (search) params.search = search;
    setSearchParams(params);
  }

  function handleSearch(e) {
    e.preventDefault();
    const params = {};
    if (category) params.category = category;
    if (searchInput.trim()) params.search = searchInput.trim();
    setSearchParams(params);
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  async function handleDelete(id) {
    const token = localStorage.getItem('admin_token');
    try {
      const resp = await fetch(`/api/species/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        setAllSpecies((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Silme hatası:', err);
    } finally {
      setDeleteConfirm(null);
    }
  }

  // Sorting
  const sorted = useMemo(() => {
    const arr = [...allSpecies];
    const CARE_ORDER = { 'Easy': 1, 'Moderate': 2, 'Difficult': 3, 'Expert Only': 4, 'Expert': 4 };
    arr.sort((a, b) => {
      let va = a[sortKey] || '';
      let vb = b[sortKey] || '';
      if (sortKey === 'care_level') {
        va = CARE_ORDER[va] || 9;
        vb = CARE_ORDER[vb] || 9;
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const cmp = va.localeCompare(vb, 'tr', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [allSpecies, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  function SortIcon({ col }) {
    if (sortKey !== col) return <span className="admin-sort-icon">↕</span>;
    return <span className="admin-sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div className="admin-layout">
      <AdminHeader />

      <main className="admin-main">
        <div className="admin-page-header">
          <h2>Türler</h2>
          <Link to="/admin/tur/yeni" className="admin-btn admin-btn-primary">+ Yeni Tür</Link>
        </div>

        <div className="admin-filters">
          <div className="admin-category-tabs">
            {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
              <button
                key={slug}
                className={`admin-tab ${category === slug ? 'active' : ''}`}
                onClick={() => handleCategoryChange(slug)}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="admin-search-form">
            <input
              type="text"
              placeholder="İsim, bilimsel ad veya aile ara..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="admin-search-input"
            />
            <button type="submit" className="admin-btn admin-btn-secondary">Ara</button>
          </form>
        </div>

        {loading ? (
          <div className="admin-loading">Yükleniyor...</div>
        ) : (
          <>
            <div className="admin-table-info">
              <span>{sorted.length} tür</span>
              {totalPages > 1 && (
                <span> — Sayfa {page} / {totalPages}</span>
              )}
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    {SORTABLE_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className="admin-th-sortable"
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label} <SortIcon col={col.key} />
                      </th>
                    ))}
                    <th>Manuel</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s) => {
                    const editedCount = Array.isArray(s.manually_edited_fields)
                      ? s.manually_edited_fields.length : 0;
                    return (
                      <tr key={s.id}>
                        <td>{s.name_tr || '—'}</td>
                        <td>{s.name || '—'}</td>
                        <td><em>{s.scientific_name || '—'}</em></td>
                        <td>{CATEGORY_LABELS[s.category] || s.category}</td>
                        <td>{s.care_level || '—'}</td>
                        <td>
                          {editedCount > 0 && (
                            <span
                              className="admin-badge admin-badge-edited"
                              title={s.manually_edited_fields.join(', ')}
                            >
                              {editedCount} alan
                            </span>
                          )}
                        </td>
                        <td className="admin-actions">
                          <Link
                            to={`/admin/tur/${s.id}`}
                            state={{
                              ids: sorted.map((sp) => sp.id),
                              index: sorted.findIndex((sp) => sp.id === s.id),
                              page,
                              category,
                              search,
                            }}
                            className="admin-btn admin-btn-sm admin-btn-secondary"
                          >
                            Düzenle
                          </Link>
                          {deleteConfirm === s.id ? (
                            <span className="admin-delete-confirm">
                              Emin misin?{' '}
                              <button
                                className="admin-btn admin-btn-sm admin-btn-danger"
                                onClick={() => handleDelete(s.id)}
                              >
                                Evet
                              </button>{' '}
                              <button
                                className="admin-btn admin-btn-sm admin-btn-outline"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                İptal
                              </button>
                            </span>
                          ) : (
                            <button
                              className="admin-btn admin-btn-sm admin-btn-danger"
                              onClick={() => setDeleteConfirm(s.id)}
                            >
                              Sil
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  «
                </button>
                <button
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ‹ Önceki
                </button>

                {/* Page number buttons — show a sliding window of 5 */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="admin-pagination-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`admin-btn admin-btn-sm ${page === p ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Sonraki ›
                </button>
                <button
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  »
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default AdminSpeciesListPage;
