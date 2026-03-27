import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BottomNav, { TopBar } from './components/BottomNav';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Toolkit from './pages/Toolkit';
import Guide from './pages/Guide';
import Reflect from './pages/Reflect';
import Circles from './pages/Circles';
import Profile from './pages/Profile';
import Verification from './pages/Verification';
import Safety from './pages/Safety';
import PrivacySettings from './pages/PrivacySettings';
import './index.css';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    document.title = 'Lunara';
  }, []);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: '80px' }}><Outlet /></div>
      <BottomNav />
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route element={<ProtectedLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/toolkit" element={<Toolkit />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/reflect" element={<Reflect />} />
            <Route path="/circles" element={<Circles />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/verify" element={<Verification />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/privacy-settings" element={<PrivacySettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
