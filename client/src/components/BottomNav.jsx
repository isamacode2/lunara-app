import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, BookOpen, PenTool, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const tabs = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/circles', icon: Users, label: 'Circles' },
  { path: '/toolkit', icon: BookOpen, label: 'Toolkit' },
  { path: '/reflect', icon: PenTool, label: 'Reflect' },
  { path: '/guide', icon: Sparkles, label: 'Guide' },
];

export function TopBar() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const initial = profile?.display_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: '20px',
      paddingRight: '20px',
      paddingTop: '12px',
      paddingBottom: '12px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
    }}>
      <h1 style={{
        fontSize: '18px',
        fontWeight: '800',
        letterSpacing: '-0.5px',
        margin: 0,
        color: 'var(--ink)',
      }}>
        lunara
      </h1>
      <button
        onClick={() => navigate('/profile')}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: profile?.avatar_url ? 'transparent' : 'rgba(217, 79, 48, 0.12)',
          border: profile?.avatar_url ? 'none' : 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px',
          overflow: 'hidden',
        }}
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Profile"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span style={{
            fontSize: '13px',
            fontWeight: '700',
            color: 'var(--accent)',
          }}>
            {initial}
          </span>
        )}
      </button>
    </div>
  );
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const s = {
    nav: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: 72,
      background: 'rgba(247,245,242,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      paddingBottom: 'env(safe-area-inset-bottom, 0)',
      zIndex: 100,
    },
    tab: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      padding: '8px 12px',
      background: 'none',
      border: 'none',
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: 0.3,
      WebkitTapHighlightColor: 'transparent',
      cursor: 'pointer',
      position: 'relative',
      transition: 'color 0.2s',
    },
  };

  return (
    <nav style={s.nav}>
      {tabs.map(({ path, icon: Icon, label }) => {
        const active = location.pathname.startsWith(path);
        return (
          <button
            key={path}
            style={{ ...s.tab, color: active ? 'var(--accent)' : 'var(--text3)' }}
            onClick={() => navigate(path)}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
