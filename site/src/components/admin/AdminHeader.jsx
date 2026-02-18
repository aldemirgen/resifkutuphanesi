import { Link, useNavigate } from 'react-router-dom';

function AdminHeader() {
  const navigate = useNavigate();
  const username = localStorage.getItem('admin_username') || 'Admin';

  function handleLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    navigate('/admin/login');
  }

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <Link to="/admin" className="admin-logo">Resif Kütüphanesi Admin</Link>
      </div>
      <div className="admin-header-right">
        <span className="admin-username">{username}</span>
        <Link to="/admin/sifre-degistir" className="admin-btn admin-btn-outline admin-btn-sm">
          Şifre Değiştir
        </Link>
        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={handleLogout}>
          Çıkış
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
