import { supabase } from './supabase';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateImageFile(file) {
  if (!file) return 'No file provided';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Only JPEG, PNG, WebP, and GIF images are allowed';
  if (file.size > MAX_FILE_SIZE) return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  return null;
}

export { validateImageFile, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE };

export async function getMyPhotos(userId) {
  const { data, error } = await supabase.from('profile_photos').select('*').eq('user_id', userId).order('position', { ascending: true });
  return { data: data || [], error };
}

export async function getPublicPhotos(userId) {
  const { data, error } = await supabase.from('profile_photos').select('*').eq('user_id', userId).eq('is_private', false).order('position', { ascending: true });
  return { data: data || [], error };
}

export async function uploadProfilePhoto(userId, file, isPrivate = false, position = 0) {
  const validationError = validateImageFile(file);
  if (validationError) return { data: null, error: { message: validationError } };
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `profiles/${userId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { data: null, error: uploadError };
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
  const { data, error } = await supabase.from('profile_photos')
    .insert({ user_id: userId, url: publicUrl, is_private: isPrivate, position }).select().single();
  return { data, error };
}

export async function deleteProfilePhoto(photoId) {
  return await supabase.from('profile_photos').delete().eq('id', photoId);
}

export async function togglePhotoPrivacy(photoId, isPrivate) {
  return await supabase.from('profile_photos').update({ is_private: isPrivate }).eq('id', photoId).select().single();
}

export async function requestPhotoAccess(requesterId, ownerId, durationMinutes) {
  await supabase.from('photo_access_requests').delete().eq('requester_id', requesterId).eq('owner_id', ownerId).in('status', ['declined', 'expired']);
  return await supabase.from('photo_access_requests')
    .upsert({ requester_id: requesterId, owner_id: ownerId, status: 'pending', duration_minutes: durationMinutes, expires_at: null }, { onConflict: 'requester_id,owner_id' })
    .select().single();
}

export async function approvePhotoAccess(requestId, durationMinutes) {
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  return await supabase.from('photo_access_requests').update({ status: 'approved', duration_minutes: durationMinutes, expires_at: expiresAt }).eq('id', requestId).select().single();
}

export async function declinePhotoAccess(requestId) {
  return await supabase.from('photo_access_requests').update({ status: 'declined' }).eq('id', requestId).select().single();
}

export async function getPendingPhotoRequests(ownerId) {
  const { data, error } = await supabase.from('photo_access_requests')
    .select('id, duration_minutes, created_at, requester:profiles!photo_access_requests_requester_id_fkey(id, display_name, avatar_url, relationship_style)')
    .eq('owner_id', ownerId).eq('status', 'pending').order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function checkPhotoAccess(requesterId, ownerId) {
  const { data } = await supabase.from('photo_access_requests').select('*')
    .eq('requester_id', requesterId).eq('owner_id', ownerId).eq('status', 'approved').single();
  if (!data) return { hasAccess: false };
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    await supabase.from('photo_access_requests').update({ status: 'expired' }).eq('id', data.id);
    return { hasAccess: false };
  }
  return { hasAccess: true, request: data };
}
