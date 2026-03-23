import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Discover from './pages/Discover';
import Chat from './pages/Chat';
import Circles from './pages/Circles';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Verification from './pages/Verification';
import Safety from './pages/Safety';
import './index.css';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}><Outlet /></div>
      <BottomNav />
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/discover" replace />;
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
            <Route path="/discover" element={<Discover />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/circles" element={<Circles />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/verify" element={<Verification />} />
            <Route path="/safety" element={<Safety />} />
          </Route>
          <Route path="*" element={<Navigate to="/discover" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
