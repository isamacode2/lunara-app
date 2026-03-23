import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import './Chat.css';

export default function Chat() {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch accepted connections with profiles
  const fetchConnections = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('connections')
      .select(`
        id, status, created_at,
        sender:profiles!connections_sender_id_fkey(id, display_name, avatar_url),
        receiver:profiles!connections_receiver_id_fkey(id, display_name, avatar_url)
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (data) {
      const mapped = data.map(c => {
        const other = c.sender.id === user.id ? c.receiver : c.sender;
        return { connectionId: c.id, ...other };
      });
      setConnections(mapped);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChat) return;

    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('connection_id', activeChat.connectionId)
        .order('created_at', { ascending: true });
      setMessages(data || []);

      // Mark unread as read
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('connection_id', activeChat.connectionId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    }
    load();

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${activeChat.connectionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `connection_id=eq.${activeChat.connectionId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChat, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!newMsg.trim() || sending) return;

    setSending(true);
    const { error } = await supabase.from('messages').insert({
      connection_id: activeChat.connectionId,
      sender_id: user.id,
      content: newMsg.trim(),
    });
    if (!error) setNewMsg('');
    setSending(false);
    inputRef.current?.focus();
  }

  function avatarFor(profile) {
    return profile.avatar_url
      || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.display_name || 'U')}&backgroundColor=3B2070&textColor=F3F0F5`;
  }

  // Chat thread view
  if (activeChat) {
    return (
      <div className="chat-page">
        <div className="chat-thread-header">
          <button className="btn-icon" onClick={() => setActiveChat(null)}>
            <ArrowLeft size={20} />
          </button>
          <img src={avatarFor(activeChat)} alt="" className="chat-header-avatar" />
          <span className="chat-header-name">{activeChat.display_name}</span>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty-thread">
              <p>Say hello to {activeChat.display_name}!</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.sender_id === user.id ? 'mine' : 'theirs'}`}>
              <div className="message-bubble">
                <p>{msg.content}</p>
                <span className="message-time">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-bar" onSubmit={handleSend}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-send" disabled={!newMsg.trim() || sending}>
            <Send size={20} />
          </button>
        </form>
      </div>
    );
  }

  // Connection list view
  return (
    <div className="chat-page">
      <div className="chat-list-header">
        <h1>Messages</h1>
      </div>

      <div className="chat-list">
        {loading ? (
          <div className="chat-loading">Loading connections...</div>
        ) : connections.length === 0 ? (
          <div className="chat-empty animate-in">
            <MessageCircle size={48} color="var(--text-muted)" />
            <h3>No connections yet</h3>
            <p>Start discovering to make your first connection</p>
          </div>
        ) : (
          connections.map(conn => (
            <button
              key={conn.connectionId}
              className="chat-list-item"
              onClick={() => setActiveChat(conn)}
            >
              <img src={avatarFor(conn)} alt="" className="chat-avatar" />
              <div className="chat-list-info">
                <span className="chat-list-name">{conn.display_name}</span>
                <span className="chat-list-preview">Tap to start chatting</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
