import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, MessageCircle, Users, Bell, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const tabs = [
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/circles', icon: Users, label: 'Circles' },
  { path: '/notifications', icon: Bell, label: 'Alerts' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from('notifications').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('read', false)
      .then(({ count }) => setUnreadNotifs(count || 0));

    const channel = supabase.channel('notif-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => setUnreadNotifs(prev => prev + 1))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  // Reset badge when visiting notifications
  useEffect(() => {
    if (location.pathname === '/notifications') setUnreadNotifs(0);
  }, [location.pathname]);

  const s = {
    nav: {
      position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', height: 72, background: 'linear-gradient(180deg, rgba(14,12,20,0.85) 0%, rgba(14,12,20,0.98) 100%)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)',
      paddingBottom: 'env(safe-area-inset-bottom, 0)', zIndex: 100,
    },
    tab: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 12px',
      background: 'none', border: 'none', fontSize: 10, fontWeight: 500, letterSpacing: 0.3,
      WebkitTapHighlightColor: 'transparent', cursor: 'pointer', position: 'relative', transition: 'color 0.2s',
    },
    badge: {
      position: 'absolute', top: 2, right: 4, width: 18, height: 18, borderRadius: '50%',
      background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
    },
  };

  return (
    <nav style={s.nav}>
      {tabs.map(({ path, icon: Icon, label }) => {
        const active = location.pathname.startsWith(path);
        const showBadge = path === '/notifications' && unreadNotifs > 0;
        return (
          <button
            key={path}
            style={{ ...s.tab, color: active ? 'var(--accent)' : 'var(--text3)' }}
            onClick={() => navigate(path)}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              {showBadge && <span style={s.badge}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>}
            </div>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
