import { supabase } from './supabase';

export async function getCircles() {
  const { data, error } = await supabase.from('circles').select('*').order('member_count', { ascending: false });
  return { data: data || [], error };
}

export async function getMyCircles(userId) {
  const { data: memberships } = await supabase.from('circle_members').select('circle_id').eq('user_id', userId);
  if (!memberships?.length) return { data: [], error: null };
  const { data, error } = await supabase.from('circles').select('*').in('id', memberships.map(m => m.circle_id));
  return { data: data || [], error };
}

export async function joinCircle(circleId, userId) {
  const { error } = await supabase.from('circle_members').upsert(
    { circle_id: circleId, user_id: userId },
    { onConflict: 'circle_id,user_id', ignoreDuplicates: true }
  );
  if (!error) {
    const { count } = await supabase.from('circle_members').select('*', { count: 'exact', head: true }).eq('circle_id', circleId);
    await supabase.from('circles').update({ member_count: count || 1 }).eq('id', circleId);
  }
  return { error };
}

export async function leaveCircle(circleId, userId) {
  return await supabase.from('circle_members').delete().eq('circle_id', circleId).eq('user_id', userId);
}

export async function getCircleFeed(circleId, limit = 30, offset = 0) {
  const { data, error } = await supabase.rpc('get_circle_feed', { p_circle_id: circleId, p_limit: limit, p_offset: offset });
  return { data: data || [], error };
}

export async function createPost(circleId, authorId, content, isAnonymous = false) {
  return await supabase.from('circle_posts').insert({ circle_id: circleId, author_id: authorId, content: content.trim(), is_anonymous: isAnonymous }).select().single();
}

export async function deletePost(postId) {
  return await supabase.from('circle_posts').delete().eq('id', postId);
}

export async function toggleLike(postId, userId) {
  const { data: existing } = await supabase.from('circle_likes').select('id').eq('post_id', postId).eq('user_id', userId).single();
  if (existing) {
    await supabase.from('circle_likes').delete().eq('id', existing.id);
    const { data: post } = await supabase.from('circle_posts').select('like_count').eq('id', postId).single();
    if (post) await supabase.from('circle_posts').update({ like_count: Math.max(0, (post.like_count || 0) - 1) }).eq('id', postId);
    return { liked: false };
  } else {
    await supabase.from('circle_likes').insert({ post_id: postId, user_id: userId });
    const { data: post } = await supabase.from('circle_posts').select('like_count').eq('id', postId).single();
    if (post) await supabase.from('circle_posts').update({ like_count: (post.like_count || 0) + 1 }).eq('id', postId);
    return { liked: true };
  }
}

export async function getReplies(postId) {
  const { data, error } = await supabase.from('circle_replies')
    .select('id, content, is_anonymous, created_at, author:profiles!circle_replies_author_id_fkey(id, display_name, avatar_url)')
    .eq('post_id', postId).order('created_at', { ascending: true });
  return { data: data || [], error };
}

export async function createReply(postId, authorId, content, isAnonymous = false) {
  const { data, error } = await supabase.from('circle_replies').insert({ post_id: postId, author_id: authorId, content: content.trim(), is_anonymous: isAnonymous }).select().single();
  if (!error) {
    const { data: post } = await supabase.from('circle_posts').select('reply_count').eq('id', postId).single();
    if (post) await supabase.from('circle_posts').update({ reply_count: (post.reply_count || 0) + 1 }).eq('id', postId);
  }
  return { data, error };
}

export function subscribeToCircle(circleId, onNewPost) {
  return supabase.channel(`circle:${circleId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'circle_posts', filter: `circle_id=eq.${circleId}` },
      (payload) => onNewPost(payload.new))
    .subscribe();
}

export function unsubscribeFromCircle(channel) {
  if (channel) supabase.removeChannel(channel);
}
