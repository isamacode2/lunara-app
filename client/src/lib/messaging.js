import { supabase, PUSH_FUNCTION_URL, SUPABASE_ANON_KEY } from './supabase';

async function triggerPush(type, payload) {
  try {
    await fetch(PUSH_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ type, payload }),
    });
  } catch (e) { /* silent */ }
}

export async function getMessages(connectionId, limit = 50) {
  const { data, error } = await supabase.rpc('get_conversation', { conn_id: connectionId, msg_limit: limit });
  return { data: data || [], error };
}

export async function sendMessage(connectionId, senderId, content) {
  const { data, error } = await supabase.from('messages')
    .insert({ connection_id: connectionId, sender_id: senderId, content: content.trim() })
    .select().single();
  if (!error && data) {
    const { data: conn } = await supabase.from('connections').select('sender_id, receiver_id').eq('id', connectionId).single();
    if (conn) {
      const receiverId = conn.sender_id === senderId ? conn.receiver_id : conn.sender_id;
      triggerPush('new_message', { connection_id: connectionId, sender_id: senderId, receiver_id: receiverId, content: content.trim() });
    }
  }
  return { data, error };
}

export async function markMessagesRead(connectionId, currentUserId) {
  return await supabase.from('messages').update({ is_read: true, read_at: new Date().toISOString() })
    .eq('connection_id', connectionId).neq('sender_id', currentUserId).eq('is_read', false);
}

export async function getUnreadCount(userId) {
  const { data, error } = await supabase.rpc('get_unread_count', { current_user_id: userId });
  return { data: data || 0, error };
}

export function subscribeToMessages(connectionId, onMessage) {
  return supabase.channel(`messages:${connectionId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `connection_id=eq.${connectionId}` },
      (payload) => onMessage(payload.new))
    .subscribe();
}

export function unsubscribeFromMessages(channel) {
  if (channel) supabase.removeChannel(channel);
}

export async function getConnectionId(userId, otherUserId) {
  const { data } = await supabase.from('connections').select('id').eq('status', 'accepted')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`).single();
  return data?.id;
}
