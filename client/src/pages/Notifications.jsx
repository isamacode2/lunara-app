import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { avatarUrl, timeAgo } from '../lib/utils';
import {
  Bell,
  UserPlus,
  Heart,
  MessageCircle,
  Image as ImageIcon,
  Users,
  Loader,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingRead, setMarkingRead] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();
  }, [user?.id]);

  async function loadNotifications() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Enrich notifications with actor profile data if needed
      const enriched = await Promise.all(
        (data || []).map(async notif => {
          if (notif.data?.actor_id) {
            try {
              const { data: actorData } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url')
                .eq('id', notif.data.actor_id)
                .single();
              return {
                ...notif,
                actor: actorData,
              };
            } catch {
              return notif;
            }
          }
          return notif;
        })
      );

      setNotifications(enriched);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleNotificationClick(notification) {
    setMarkingRead(notification.id);

    try {
      // Mark as read
      if (!notification.read) {
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notification.id);

        if (updateError) throw updateError;

        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      }

      // Navigate based on type
      switch (notification.type) {
        case 'connection_request':
        case 'connection_accepted':
        case 'new_message':
          navigate('/chat');
          break;
        case 'circle_activity':
          navigate('/circles');
          break;
        case 'photo_access':
          navigate('/profile');
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setMarkingRead(null);
    }
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        return UserPlus;
      case 'new_message':
        return MessageCircle;
      case 'photo_access':
        return ImageIcon;
      case 'circle_activity':
        return Users;
      default:
        return Bell;
    }
  }

  function getNotificationIconColor(type) {
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        return 'rgba(168, 85, 247, 0.2)'; // Purple background
      case 'new_message':
        return 'rgba(255, 190, 85, 0.2)'; // Gold background
      case 'photo_access':
        return 'rgba(168, 85, 247, 0.2)'; // Purple background
      case 'circle_activity':
        return 'rgba(168, 85, 247, 0.2)'; // Purple background
      default:
        return 'rgba(168, 85, 247, 0.2)'; // Purple background
    }
  }

  function getNotificationIconFill(type) {
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        return 'var(--primary)'; // Purple
      case 'new_message':
        return 'var(--gold)'; // Gold
      case 'photo_access':
        return 'var(--primary)'; // Purple
      case 'circle_activity':
        return 'var(--primary)'; // Purple
      default:
        return 'var(--primary)'; // Purple
    }
  }

  function generateDescription(notification) {
    const { type, data } = notification;
    const actorName =
      notification.actor?.display_name || data?.actor_name || 'Someone';

    switch (type) {
      case 'connection_request':
        return `${actorName} wants to connect`;
      case 'connection_accepted':
        return `${actorName} accepted your connection`;
      case 'new_message':
        return `New message from ${actorName}`;
      case 'photo_access':
        return `${actorName} requested photo access`;
      case 'circle_activity':
        return `Activity in ${data?.circle_name || 'a circle'} you're in`;
      default:
        return 'You have a new notification';
    }
  }

  if (loading) {
    return (
      <div className="page page-center" style={{ backgroundColor: 'var(--bg)' }}>
        <Loader size={32} className="spin" />
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="page page-scroll" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Bell size={24} style={{ color: 'var(--accent)' }} />
        <h1 style={{ fontSize: '28px', margin: 0 }}>Notifications</h1>
      </div>

      {error && (
        <div
          className="msg-error"
          style={{ margin: '16px 0', textAlign: 'center' }}
        >
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="page-empty">
          <Bell size={48} style={{ color: 'var(--text2)' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>
            No notifications yet
          </h2>
          <p style={{ color: 'var(--text2)' }}>
            We'll let you know when something happens
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {notifications.map(notification => {
            const IconComponent = getNotificationIcon(notification.type);
            const isRead = notification.read;
            const isProcessing = markingRead === notification.id;

            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                disabled={isProcessing}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  background: isRead ? 'var(--bg-card)' : 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  opacity: isProcessing ? 0.6 : 1,
                }}
                onMouseEnter={e => {
                  if (!isProcessing) {
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isRead
                    ? 'var(--bg-card)'
                    : 'var(--bg-elevated)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                {/* Icon Container */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    background: getNotificationIconColor(notification.type),
                    flexShrink: 0,
                  }}
                >
                  <IconComponent
                    size={20}
                    style={{ color: getNotificationIconFill(notification.type) }}
                  />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: isRead ? 500 : 600,
                        color: 'var(--text)',
                        flex: 1,
                      }}
                    >
                      {generateDescription(notification)}
                    </p>
                    {!isRead && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text2)',
                    }}
                  >
                    {timeAgo(notification.created_at)}
                  </span>
                </div>

                {isProcessing && (
                  <Loader
                    size={16}
                    className="spin"
                    style={{
                      color: 'var(--text2)',
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
