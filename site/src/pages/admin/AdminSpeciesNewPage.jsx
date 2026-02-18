import { Link, useNavigate } from 'react-router-dom';
import SpeciesForm from '../../components/admin/SpeciesForm';
import AdminHeader from '../../components/admin/AdminHeader';
import './admin.css';

function AdminSpeciesNewPage() {
  const navigate = useNavigate();

  async function handleSubmit(payload) {
    const token = localStorage.getItem('admin_token');
    const resp = await fetch('/api/species', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || 'Oluşturma başarısız');
    }

    const created = await resp.json();
    navigate(`/admin/tur/${created.id}`);
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
              <span>Yeni</span>
            </div>
            <h2>Yeni Tür Ekle</h2>
          </div>
        </div>

        <SpeciesForm
          onSubmit={handleSubmit}
          submitLabel="Oluştur"
          isNew
        />
      </main>
    </div>
  );
}

export default AdminSpeciesNewPage;
