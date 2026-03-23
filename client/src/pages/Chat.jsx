import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getMessages,
  sendMessage,
  markMessagesRead,
  subscribeToMessages,
  unsubscribeFromMessages,
  getUnreadCount,
} from '../lib/messaging';
import { getPendingRequests, acceptConnection, declineConnection } from '../lib/discovery';
import { avatarUrl, formatTime, timeAgo } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, MessageCircle, Image as ImageIcon, Loader } from 'lucide-react';

export default function Chat() {
  const { user } = useAuth();
  const [view, setView] = useState('matches'); // 'matches' or 'requests'
  const [activeChat, setActiveChat] = useState(null); // null for list, or { id, user_data }
  const [matches, setMatches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [subscription, setSubscription] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchInitialData();
  }, [user?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function fetchInitialData() {
    setLoading(true);

    // Fetch requests
    const { data: requestsData } = await getPendingRequests(user.id);
    setRequests(requestsData || []);

    // Fetch accepted matches
    const { data: matchesData } = await supabase
      .from('connections')
      .select('id, sender_id, receiver_id, created_at, sender:profiles!connections_sender_id_fkey(id, display_name, avatar_url), receiver:profiles!connections_receiver_id_fkey(id, display_name, avatar_url)')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (matchesData) {
      // For each match, get last message and unread count
      const matchesWithLastMsg = await Promise.all(
        matchesData.map(async (conn) => {
          const otherUser = conn.sender_id === user.id ? conn.receiver : conn.sender;
          const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .eq('connection_id', conn.id)
            .order('created_at', { ascending: false })
            .limit(1);
          const lastMsg = msgs?.[0];

          // Get unread count
          const { data: unreadData } = await supabase
            .from('messages')
            .select('id', { count: 'exact' })
            .eq('connection_id', conn.id)
            .neq('sender_id', user.id)
            .eq('is_read', false);

          return {
            ...conn,
            otherUser,
            lastMessage: lastMsg,
            unreadCount: unreadData?.length || 0,
          };
        })
      );
      setMatches(matchesWithLastMsg);
    }

    setLoading(false);
  }

  async function handleAcceptRequest(requestId, senderId) {
    const { error } = await acceptConnection(requestId);
    if (!error) {
      setRequests(requests.filter(r => r.id !== requestId));
      // Refresh matches
      fetchInitialData();
    }
  }

  async function handleDeclineRequest(requestId) {
    await declineConnection(requestId);
    setRequests(requests.filter(r => r.id !== requestId));
  }

  async function openChat(match) {
    const otherUser = match.otherUser;
    setActiveChat({
      id: match.id,
      user: otherUser,
      userId: match.sender_id === user.id ? match.receiver_id : match.sender_id,
    });

    // Mark messages as read
    await markMessagesRead(match.id, user.id);

    // Fetch messages
    const { data: messagesData } = await getMessages(match.id);
    setMessages(messagesData || []);

    // Subscribe to new messages
    if (subscription) {
      unsubscribeFromMessages(subscription);
    }
    const channel = subscribeToMessages(match.id, (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
    });
    setSubscription(channel);
  }

  async function sendMsg() {
    if (!messageText.trim() || !activeChat) return;

    setSending(true);
    const { error } = await sendMessage(activeChat.id, user.id, messageText);

    if (!error) {
      setMessageText('');
      // Message will appear via subscription
    }
    setSending(false);
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    setUploading(true);
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const path = `${activeChat.id}/${timestamp}.${ext}`;

    try {
      const { error: upErr } = await supabase.storage
        .from('chat-images')
        .upload(path, file, { contentType: file.type });

      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(path);
      const imgUrl = publicUrl + '?t=' + timestamp;
      const content = `[img]${imgUrl}[/img]`;

      await sendMessage(activeChat.id, user.id, content);
      setMessageText('');
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        unsubscribeFromMessages(subscription);
      }
    };
  }, [subscription]);

  // If viewing a chat conversation
  if (activeChat) {
    return (
      <div className="page" style={{ backgroundColor: 'var(--bg)' }}>
        {/* Header */}
        <div
          className="page-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <button
            className="btn-icon"
            onClick={() => {
              setActiveChat(null);
              if (subscription) {
                unsubscribeFromMessages(subscription);
                setSubscription(null);
              }
            }}
            style={{ background: 'transparent' }}
          >
            <ArrowLeft size={20} />
          </button>

          <img
            src={avatarUrl(activeChat.user)}
            alt={activeChat.user.display_name}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 600 }}>
              {activeChat.user.display_name}
            </h2>
          </div>
        </div>

        {/* Messages List */}
        <div
          className="page-scroll"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '16px 16px 88px 16px',
            backgroundColor: 'var(--bg)',
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--text3)',
                marginTop: '40px',
              }}
            >
              <MessageCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isOwn = msg.sender_id === user.id;
              const isImageMsg = msg.content.startsWith('[img]') && msg.content.endsWith('[/img]');
              const imageUrl = isImageMsg
                ? msg.content.replace('[img]', '').replace('[/img]', '')
                : null;

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                    }}
                  >
                    {isImageMsg ? (
                      <>
                        <img
                          src={imageUrl}
                          alt="Message image"
                          style={{
                            maxWidth: '100%',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: '4px',
                          }}
                        />
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text2)',
                            textAlign: isOwn ? 'right' : 'left',
                          }}
                        >
                          {formatTime(msg.created_at)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            background: isOwn ? 'var(--primary)' : 'var(--bg-elevated)',
                            color: isOwn ? '#fff' : 'var(--text)',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: '14px',
                            wordWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {msg.content}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text2)',
                            marginTop: '4px',
                            textAlign: isOwn ? 'right' : 'left',
                          }}
                        >
                          {formatTime(msg.created_at)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 16px',
            background: 'var(--bg)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end',
          }}
        >
          {/* Image Upload Button */}
          <button
            className="btn-icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ flexShrink: 0 }}
          >
            {uploading ? <Loader size={18} className="spin" /> : <ImageIcon size={18} />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />

          {/* Text Input */}
          <input
            type="text"
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && !sending && sendMsg()}
            placeholder="Say something..."
            style={{
              flex: 1,
              background: 'var(--bg-elevated)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              fontSize: '14px',
              color: 'var(--text)',
            }}
            disabled={sending}
          />

          {/* Send Button */}
          <button
            className="btn-icon"
            onClick={sendMsg}
            disabled={!messageText.trim() || sending}
            style={{
              background: messageText.trim() && !sending ? 'var(--primary)' : 'var(--bg-elevated)',
              color: messageText.trim() && !sending ? '#fff' : 'var(--text2)',
              flexShrink: 0,
            }}
          >
            {sending ? <Loader size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    );
  }

  // Chat list view
  return (
    <div className="page" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageCircle size={24} style={{ color: 'var(--accent)' }} />
        <h1 style={{ fontSize: '28px', margin: 0 }}>Messages</h1>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          padding: '0 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setView('requests')}
          style={{
            flex: 1,
            padding: '12px 0',
            background: 'none',
            border: 'none',
            color: view === 'requests' ? 'var(--accent)' : 'var(--text2)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: view === 'requests' ? '2px solid var(--accent)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          Requests
          {requests.length > 0 && (
            <span
              style={{
                marginLeft: '8px',
                background: 'var(--danger)',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '700',
              }}
            >
              {requests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setView('matches')}
          style={{
            flex: 1,
            padding: '12px 0',
            background: 'none',
            border: 'none',
            color: view === 'matches' ? 'var(--accent)' : 'var(--text2)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: view === 'matches' ? '2px solid var(--accent)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          Matches
          {matches.reduce((sum, m) => sum + (m.unreadCount || 0), 0) > 0 && (
            <span
              style={{
                marginLeft: '8px',
                background: 'var(--danger)',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '700',
              }}
            >
              {matches.reduce((sum, m) => sum + (m.unreadCount || 0), 0)}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="page-scroll" style={{ backgroundColor: 'var(--bg)' }}>
        {loading ? (
          <div className="page-center">
            <Loader size={32} className="spin" />
            <p>Loading...</p>
          </div>
        ) : view === 'requests' ? (
          // Requests Tab
          <>
            {requests.length === 0 ? (
              <div className="page-empty">
                <MessageCircle size={40} style={{ opacity: 0.3 }} />
                <h3>No requests yet</h3>
                <p>When someone connects with you, they'll appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
                {requests.map(req => (
                  <div
                    key={req.id}
                    className="card"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      gap: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={avatarUrl(req.sender)}
                      alt={req.sender.display_name}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '15px', margin: '0 0 4px 0', fontWeight: 600 }}>
                        {req.sender.display_name}
                      </h3>

                      {req.sender.relationship_style && (
                        <div style={{ marginBottom: '6px' }}>
                          <span className="tag tag-purple" style={{ fontSize: '11px' }}>
                            {req.sender.relationship_style}
                          </span>
                        </div>
                      )}

                      {req.sender_intent && (
                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--text2)',
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {req.sender_intent}
                        </p>
                      )}

                      <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '6px 0 0 0' }}>
                        {timeAgo(req.created_at)}
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={e => {
                          e.stopPropagation();
                          handleAcceptRequest(req.id, req.sender_id);
                        }}
                        style={{ fontSize: '12px', padding: '8px 14px' }}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeclineRequest(req.id);
                        }}
                        style={{ fontSize: '12px', padding: '8px 14px' }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // Matches Tab
          <>
            {matches.length === 0 ? (
              <div className="page-empty">
                <MessageCircle size={40} style={{ opacity: 0.3 }} />
                <h3>No matches yet</h3>
                <p>Connect with someone to start messaging</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', padding: '0' }}>
                {matches.map(match => (
                  <div
                    key={match.id}
                    onClick={() => openChat(match)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      background: 'var(--bg)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={avatarUrl(match.otherUser)}
                        alt={match.otherUser.display_name}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                      {(match.unreadCount || 0) > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-4px',
                            right: '-4px',
                            background: 'var(--danger)',
                            color: '#fff',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '700',
                            border: '2px solid var(--bg)',
                          }}
                        >
                          {match.unreadCount}
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '15px', margin: '0 0 4px 0', fontWeight: 600 }}>
                        {match.otherUser.display_name}
                      </h3>

                      {match.lastMessage ? (
                        <p
                          style={{
                            fontSize: '13px',
                            color: match.unreadCount ? 'var(--text)' : 'var(--text2)',
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontWeight: match.unreadCount ? 600 : 400,
                          }}
                        >
                          {match.lastMessage.content.startsWith('[img]')
                            ? '📷 Image'
                            : match.lastMessage.content}
                        </p>
                      ) : (
                        <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>
                          No messages yet
                        </p>
                      )}

                      <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '4px 0 0 0' }}>
                        {match.lastMessage ? timeAgo(match.lastMessage.created_at) : timeAgo(match.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
