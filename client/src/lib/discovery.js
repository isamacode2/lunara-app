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

export async function getDiscoverProfiles(userId) {
  const { data, error } = await supabase.rpc('get_discover_profiles', { current_user_id: userId, max_distance_km: 500 });
  return { data: data || [], error };
}

export async function sendConnection(senderId, receiverId, intent = '') {
  const { data, error } = await supabase
    .from('connections')
    .insert({ sender_id: senderId, receiver_id: receiverId, sender_intent: intent, status: 'pending' })
    .select().single();
  if (!error && data) triggerPush('new_connection', { sender_id: senderId, receiver_id: receiverId });
  return { data, error };
}

export async function acceptConnection(connectionId) {
  const { data, error } = await supabase
    .from('connections')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', connectionId).select().single();
  if (!error && data) triggerPush('connection_accepted', { sender_id: data.sender_id, receiver_id: data.receiver_id });
  return { data, error };
}

export async function declineConnection(connectionId) {
  return await supabase.from('connections').update({ status: 'declined', updated_at: new Date().toISOString() }).eq('id', connectionId).select().single();
}

export async function passProfile(userId, passedId) {
  return await supabase.from('passes').insert({ user_id: userId, passed_id: passedId }).select().single();
}

export async function getPendingRequests(userId) {
  const { data, error } = await supabase.from('connections')
    .select('id, sender_intent, created_at, sender:profiles!connections_sender_id_fkey(id, display_name, bio, avatar_url, relationship_style)')
    .eq('receiver_id', userId).eq('status', 'pending').order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function getMatches(userId) {
  const { data, error } = await supabase.rpc('get_matches', { current_user_id: userId });
  return { data: data || [], error };
}

export async function logProfileView(viewerId, viewedId) {
  await supabase.from('profile_views').insert({ viewer_id: viewerId, viewed_id: viewedId });
}
