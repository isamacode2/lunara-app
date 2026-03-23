import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, MessageCircle, User } from 'lucide-react';
import './BottomNav.css';

const tabs = [
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {tabs.map(({ path, icon: Icon, label }) => {
        const active = location.pathname.startsWith(path);
        return (
          <button
            key={path}
            className={`nav-tab ${active ? 'active' : ''}`}
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
