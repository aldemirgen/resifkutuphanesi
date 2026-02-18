import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import SpeciesPage from './pages/SpeciesPage';
import SearchResultsPage from './pages/SearchResultsPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminSpeciesListPage from './pages/admin/AdminSpeciesListPage';
import AdminSpeciesEditPage from './pages/admin/AdminSpeciesEditPage';
import AdminSpeciesNewPage from './pages/admin/AdminSpeciesNewPage';
import AdminChangePasswordPage from './pages/admin/AdminChangePasswordPage';
import PrivateRoute from './components/admin/PrivateRoute';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <div className="app">
      <ScrollToTop />
      {!isAdmin && <Navbar />}
      <main className={isAdmin ? '' : 'main-content'}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/kategori/:slug" element={<CategoryPage />} />
          <Route path="/tur/:id" element={<SpeciesPage />} />
          <Route path="/arama" element={<SearchResultsPage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
          <Route path="/admin/tur" element={<PrivateRoute><AdminSpeciesListPage /></PrivateRoute>} />
          <Route path="/admin/tur/yeni" element={<PrivateRoute><AdminSpeciesNewPage /></PrivateRoute>} />
          <Route path="/admin/tur/:id" element={<PrivateRoute><AdminSpeciesEditPage /></PrivateRoute>} />
          <Route path="/admin/sifre-degistir" element={<PrivateRoute><AdminChangePasswordPage /></PrivateRoute>} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}

export default App;
