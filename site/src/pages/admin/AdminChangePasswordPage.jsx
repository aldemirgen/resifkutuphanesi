import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminHeader from '../../components/admin/AdminHeader';
import './admin.css';

function AdminChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }

    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalı');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('admin_token');

    try {
      const resp = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || 'Şifre değiştirilemedi');
        return;
      }

      setSuccess('Şifreniz başarıyla değiştirildi. Yönlendiriliyorsunuz...');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => navigate('/admin'), 2000);
    } catch {
      setError('Sunucuya bağlanılamadı');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-layout">
      <AdminHeader />

      <main className="admin-main">
        <div className="admin-page-header">
          <div>
            <div className="admin-breadcrumb">
              <Link to="/admin">Dashboard</Link>
              <span> / </span>
              <span>Şifre Değiştir</span>
            </div>
            <h2>Şifre Değiştir</h2>
          </div>
        </div>

        <div className="admin-change-password-box">
          <form onSubmit={handleSubmit} className="admin-species-form">
            {error && <div className="admin-error">{error}</div>}
            {success && <div className="admin-success">{success}</div>}

            <div className="admin-form-section">
              <h3>Şifre Güncelle</h3>
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Mevcut Şifre</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="admin-form-group">
                  <label>Yeni Şifre</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="En az 6 karakter"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Yeni Şifre (Tekrar)</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={saving}
              >
                {saving ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
              </button>
              <Link to="/admin" className="admin-btn admin-btn-outline">
                İptal
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminChangePasswordPage;
