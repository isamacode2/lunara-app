import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getMyPhotos, uploadProfilePhoto, deleteProfilePhoto, togglePhotoPrivacy, getPendingPhotoRequests, approvePhotoAccess, declinePhotoAccess } from '../lib/photos';
import { avatarUrl, timeAgo } from '../lib/utils';
import { Camera, LogOut, Save, Loader, Edit3, MapPin, Heart, Shield, Lock, Unlock, Eye, EyeOff, Plus, X, Check, AlertTriangle, ChevronRight, Trash2, Clock, BadgeCheck, ExternalLink, Mic, MicOff, Play, Square, Globe, User as UserIcon, Search } from 'lucide-react';

// ─── Style constants ───
const pageStyle = { height: '100%', overflowY: 'auto' };
const headerContainerStyle = { padding: '24px 20px 20px', background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg) 100%)' };
const avatarContainerStyle = { position: 'relative', width: '100px', height: '100px', margin: '0 auto 16px', cursor: 'pointer' };
const avatarStyle = { width: '100%', height: '100%', borderRadius: '50%', border: '3px solid var(--accent)', objectFit: 'cover', display: 'block' };
const avatarOverlayStyle = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', opacity: 0, transition: 'opacity 0.2s' };
const contentStyle = { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' };
const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' };
const cardHeaderStyle = { padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const cardTitleStyle = { fontSize: '16px', fontWeight: '600', fontFamily: "'Playfair Display', serif" };
const cardBodyStyle = { padding: '20px' };
const infoRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid var(--border)', marginBottom: '14px' };
const infoRowLastStyle = { ...infoRowStyle, borderBottom: 'none', paddingBottom: '0', marginBottom: '0' };
const infoLabelStyle = { fontSize: '13px', fontWeight: '500', color: 'var(--text2)' };
const infoValueStyle = { fontSize: '15px', color: 'var(--text)', textAlign: 'right', flex: 1, marginLeft: '12px' };
const formGroupStyle = { display: 'flex', flexDirection: 'column', gap: '6px' };
const labelStyle = { fontSize: '13px', fontWeight: '500', color: 'var(--text2)' };
const inputStyle = { fontFamily: "'Outfit', sans-serif", fontSize: '15px', background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '12px 14px', outline: 'none', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' };
const textareaStyle = { ...inputStyle, minHeight: '80px', resize: 'vertical' };
const selectStyle = { ...inputStyle, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239e95a9' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '36px' };
const pillContainerStyle = { display: 'flex', flexWrap: 'wrap', gap: '8px' };
const pillStyle = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 'var(--radius-full)', background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '13px', fontWeight: '600' };

const photoGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' };
const photoItemStyle = { position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer' };
const photoImageStyle = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
const photoOverlayStyle = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', color: '#fff' };
const photoLockBadgeStyle = { position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600' };

// ─── Options arrays ───
const RELATIONSHIP_STYLES = ['Polyamorous', 'Open Relationship', 'Relationship Anarchy', 'Swinging', 'Mono-Poly', 'Exploring ENM', 'Other'];
const EXPERIENCE_LEVELS = ['Beginner', 'Some Experience', 'Experienced', 'Very Experienced'];
const GENDER_OPTIONS = ['Man', 'Woman', 'Non-binary', 'Genderqueer', 'Genderfluid', 'Agender', 'Two-Spirit', 'Other', 'Prefer not to say'];
const BODY_TYPE_OPTIONS = ['Slim', 'Athletic', 'Average', 'Curvy', 'Plus-size', 'Muscular', 'Dad-bod', 'Prefer not to say'];
const SMOKING_OPTIONS = ['Never', 'Socially', 'Regularly', 'Trying to quit'];
const DRINKING_OPTIONS = ['Never', 'Socially', 'Regularly', 'Sober'];
const CHILDREN_OPTIONS = ['No children', 'Have children', 'Want children', 'Open to children', 'Prefer not to say'];
const PARTNER_STATUS_OPTIONS = ['Single', 'Partnered', 'Married', 'Its complicated', 'Prefer not to say'];
const COMMUNICATION_STYLES = ['Direct', 'Gentle', 'Playful', 'Intellectual', 'Spontaneous'];
const AVAILABLE_TIME_OPTIONS = ['Weekdays', 'Weekends', 'Evenings', 'Flexible', 'Limited'];

const INTEREST_OPTIONS = ['Hiking', 'Cooking', 'Travel', 'Reading', 'Music', 'Art', 'Yoga', 'Gaming', 'Photography', 'Dancing', 'Fitness', 'Movies', 'Board Games', 'Meditation', 'Gardening', 'Wine', 'Craft Beer', 'Festivals', 'Theatre', 'Camping', 'Surfing', 'Cycling', 'Writing', 'Podcasts', 'Volunteering', 'Tech', 'Fashion', 'Pets', 'Karaoke', 'Spirituality'];
const LOOKING_FOR_OPTIONS = ['Friendship', 'Romance', 'Casual', 'Long-term', 'Play Partner', 'Nesting Partner', 'Comet', 'FWB', 'Group Activities', 'Emotional Connection'];
const LOVE_LANGUAGE_OPTIONS = ['Words of Affirmation', 'Quality Time', 'Physical Touch', 'Acts of Service', 'Gifts'];
const LANGUAGE_OPTIONS = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Dutch', 'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Swahili', 'Russian', 'Sign Language', 'Other'];

// ─── All editable fields with defaults ───
const EMPTY_FORM = {
  display_name: '', bio: '', gender: '', pronouns: '', birth_date: '', age: '',
  location_city: '', location_approx: '', latitude: '', longitude: '',
  relationship_style: '', orientation: '', experience_level: '', partner_status: '', visibility_mode: 'standard',
  occupation: '', education: '', height_cm: '', body_type: '', ethnicity: '', smoking: '', drinking: '', children: '', available_time: '', communication_style: '',
  interests: [], languages: [], looking_for: [], love_languages: [], desires: [], hard_limits: [],
  boundaries_note: '', fun_fact: '',
};

// ─── Location Autocomplete Component ───
function LocationAutocomplete({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  function handleChange(val) {
    onChange(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.length < 3) { setSuggestions([]); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5`);
        const data = await res.json();
        setSuggestions(data.map(d => ({ display: d.display_name, lat: parseFloat(d.lat), lon: parseFloat(d.lon) })));
      } catch { setSuggestions([]); }
      setSearching(false);
    }, 400);
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text" style={inputStyle} value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder="Start typing a city..."
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; setTimeout(() => setSuggestions([]), 200); }}
        />
        {searching && <Loader size={14} style={{ position: 'absolute', right: '12px', top: '14px', animation: 'spin 1s linear infinite', color: 'var(--text2)' }} />}
      </div>
      {suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {suggestions.map((s, i) => (
            <div key={i}
              style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text)', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
              onMouseDown={() => { onSelect(s); setSuggestions([]); }}
              onMouseEnter={e => e.target.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.target.style.background = 'transparent'}
            >
              {s.display}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Multi-select Pill Picker ───
function PillPicker({ label, options, selected, onChange, allowCustom }) {
  const [customVal, setCustomVal] = useState('');
  return (
    <div style={formGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={pillContainerStyle}>
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button key={opt} type="button"
              onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
              style={{ ...pillStyle, background: active ? 'var(--accent-dim)' : 'var(--bg-elevated)', color: active ? 'var(--accent)' : 'var(--text2)', border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {allowCustom && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input type="text" style={{ ...inputStyle, flex: 1 }} placeholder="Add custom..." value={customVal} onChange={e => setCustomVal(e.target.value)} />
          <button type="button" onClick={() => { if (customVal.trim() && !selected.includes(customVal.trim())) { onChange([...selected, customVal.trim()]); setCustomVal(''); } }}
            style={{ padding: '8px 14px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            Add
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Voice Note Component ───
function VoiceNoteCard({ user, profile }) {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioUrl, setAudioUrl] = useState(profile?.voice_intro_url || null);
  const [playing, setPlaying] = useState(false);
  const [audioRef] = useState({ current: null });
  const [uploading, setUploading] = useState(false);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        try {
          setUploading(true);
          const path = `${user.id}/voice_intro_${Date.now()}.webm`;
          const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'audio/webm' });
          if (!upErr) {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
            await supabase.from('profiles').update({ voice_intro_url: publicUrl + '?t=' + Date.now(), has_voice_intro: true }).eq('id', user.id);
          }
        } catch (err) { console.error('Voice upload failed:', err); }
        finally { setUploading(false); }
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) { console.error('Microphone access denied:', err); }
  }
  function stopRecording() { if (mediaRecorder && mediaRecorder.state !== 'inactive') { mediaRecorder.stop(); setRecording(false); } }
  function playAudio() { if (!audioUrl) return; if (audioRef.current) audioRef.current.pause(); const a = new Audio(audioUrl); audioRef.current = a; a.onended = () => setPlaying(false); a.play(); setPlaying(true); }
  function stopAudio() { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } setPlaying(false); }

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <h3 style={cardTitleStyle}>Voice Note</h3>
        {uploading && <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />}
      </div>
      <div style={cardBodyStyle}>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px', lineHeight: '1.5' }}>
          Record a short voice intro so potential connections can hear your voice.
        </p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {audioUrl && !recording && (
            <button onClick={playing ? stopAudio : playAudio}
              style={{ flex: 1, padding: '12px 20px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-lg)', color: 'var(--accent)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {playing ? <><Square size={16} /> Stop</> : <><Play size={16} /> Play</>}
            </button>
          )}
          <button onClick={recording ? stopRecording : startRecording}
            style={{ flex: audioUrl && !recording ? 1 : undefined, width: audioUrl && !recording ? undefined : '100%', padding: '12px 20px', background: recording ? 'var(--danger-dim)' : 'linear-gradient(135deg, var(--primary), var(--primary-light))', border: recording ? '1px solid var(--danger)' : 'none', borderRadius: 'var(--radius-lg)', color: recording ? 'var(--danger)' : '#fff', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {recording ? <><MicOff size={16} /> Stop Recording</> : audioUrl ? <><Mic size={16} /> Re-record</> : <><Mic size={16} /> Record Voice Note</>}
          </button>
        </div>
        {recording && (
          <div style={{ marginTop: '12px', padding: '12px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: '13px', color: 'var(--danger)' }}>Recording...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN PROFILE COMPONENT
// ═══════════════════════════════════════════
export default function Profile() {
  const { user, profile, uploadAvatar, updateProfile, signOut, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [stats, setStats] = useState({ connections: 0, profileViews: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState({});
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });

  useEffect(() => { if (user?.id) loadData(); }, [user?.id]);

  // Populate form when profile loads
  useEffect(() => {
    if (!profile) return;
    const f = { ...EMPTY_FORM };
    for (const key of Object.keys(f)) {
      if (profile[key] !== undefined && profile[key] !== null) {
        if (Array.isArray(f[key])) {
          f[key] = Array.isArray(profile[key]) ? profile[key] : [];
        } else {
          f[key] = profile[key];
        }
      }
    }
    // birth_date → date input format
    if (f.birth_date) { try { f.birth_date = new Date(f.birth_date).toISOString().split('T')[0]; } catch {} }
    setEditForm(f);
  }, [profile]);

  async function loadData() {
    try {
      setLoading(true); setError(null);
      const { data: photosData } = await getMyPhotos(user.id);
      setPhotos(photosData || []);
      const { data: requestsData } = await getPendingPhotoRequests(user.id);
      setPendingRequests(requestsData || []);
      const { data: connectionsData } = await supabase.from('connections').select('id').eq('user_id', user.id).eq('status', 'accepted');
      const { data: viewsData } = await supabase.from('profile_views').select('id').eq('viewed_user_id', user.id);
      setStats({ connections: connectionsData?.length || 0, profileViews: viewsData?.length || 0 });
    } catch (err) { console.error(err); setError('Failed to load profile data'); }
    finally { setLoading(false); }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    try { setUploading(true); setError(null); await uploadAvatar(file); setSuccess('Avatar updated!'); setTimeout(() => setSuccess(null), 2000); }
    catch (err) { console.error(err); setError('Failed to upload avatar'); }
    finally { setUploading(false); }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setUploading(true); setError(null);
      const publicPhotos = photos.filter(p => !p.is_private);
      const isPrivate = publicPhotos.length >= 5;
      const { data, error: uploadErr } = await uploadProfilePhoto(user.id, file, isPrivate, photos.length);
      if (uploadErr) throw uploadErr;
      setPhotos([...photos, data]);
      setSuccess(`Photo uploaded as ${isPrivate ? 'private' : 'public'}!`); setTimeout(() => setSuccess(null), 2000);
    } catch (err) { console.error(err); setError('Failed to upload photo'); }
    finally { setUploading(false); }
  }

  async function handleDeletePhoto(photoId) {
    if (!confirm('Delete this photo?')) return;
    try { setError(null); await deleteProfilePhoto(photoId); setPhotos(photos.filter(p => p.id !== photoId)); setSuccess('Photo deleted'); setTimeout(() => setSuccess(null), 2000); }
    catch (err) { console.error(err); setError('Failed to delete photo'); }
  }

  async function handleTogglePhotoPrivacy(photoId, isPrivate) {
    try {
      setError(null);
      const newPrivacy = !isPrivate;
      if (!newPrivacy && photos.filter(p => !p.is_private && p.id !== photoId).length >= 5) { setError('Maximum 5 public photos allowed'); return; }
      await togglePhotoPrivacy(photoId, newPrivacy);
      setPhotos(photos.map(p => p.id === photoId ? { ...p, is_private: newPrivacy } : p));
      setSuccess(`Photo marked as ${newPrivacy ? 'private' : 'public'}`); setTimeout(() => setSuccess(null), 2000);
    } catch (err) { console.error(err); setError('Failed to update photo'); }
  }

  async function handleApproveAccess(requestId, durationMin) {
    try { setError(null); await approvePhotoAccess(requestId, durationMin); setPendingRequests(pendingRequests.filter(r => r.id !== requestId)); setSuccess('Access approved!'); setTimeout(() => setSuccess(null), 2000); }
    catch (err) { console.error(err); setError('Failed to approve access'); }
  }

  async function handleDeclineAccess(requestId) {
    try { setError(null); await declinePhotoAccess(requestId); setPendingRequests(pendingRequests.filter(r => r.id !== requestId)); setSuccess('Access declined'); setTimeout(() => setSuccess(null), 2000); }
    catch (err) { console.error(err); setError('Failed to decline access'); }
  }

  // ─── SAVE ALL PROFILE FIELDS ───
  async function handleSaveProfile() {
    try {
      setSaving(true); setError(null);
      const updates = { ...editForm };
      // Convert types
      if (updates.height_cm) updates.height_cm = parseInt(updates.height_cm, 10) || null;
      if (updates.age) updates.age = parseInt(updates.age, 10) || null;
      if (updates.latitude) updates.latitude = parseFloat(updates.latitude) || null;
      if (updates.longitude) updates.longitude = parseFloat(updates.longitude) || null;
      if (updates.birth_date && updates.birth_date !== '') { updates.birth_date = new Date(updates.birth_date).toISOString(); } else { updates.birth_date = null; }
      // Remove empty strings for nullable text fields
      for (const key of Object.keys(updates)) {
        if (updates[key] === '' && !Array.isArray(updates[key])) updates[key] = null;
      }
      await updateProfile(updates);
      setIsEditing(false);
      setSuccess('Profile saved!'); setTimeout(() => setSuccess(null), 3000);
    } catch (err) { console.error(err); setError(err.message || 'Failed to save profile'); }
    finally { setSaving(false); }
  }

  // ─── Helpers ───
  function setField(key, val) { setEditForm(prev => ({ ...prev, [key]: val })); }
  function renderSelect(key, options, placeholder) {
    return (
      <select style={selectStyle} value={editForm[key] || ''} onChange={e => setField(key, e.target.value)}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  function renderInput(key, placeholder, type = 'text') {
    return (
      <input type={type} style={inputStyle} value={editForm[key] || ''} onChange={e => setField(key, e.target.value)} placeholder={placeholder}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
    );
  }

  // ─── Loading state ───
  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader style={{ animation: 'spin 1s linear infinite' }} size={40} color="var(--accent)" />
      </div>
    );
  }

  const publicPhotos = photos.filter(p => !p.is_private);
  const privatePhotos = photos.filter(p => p.is_private);

  // ═══════════ RENDER ═══════════
  return (
    <div style={pageStyle}>
      {/* ── Header ── */}
      <div style={headerContainerStyle}>
        <div style={avatarContainerStyle}
          onMouseEnter={e => { const o = e.currentTarget.querySelector('[data-overlay]'); if (o) o.style.opacity = '1'; }}
          onMouseLeave={e => { const o = e.currentTarget.querySelector('[data-overlay]'); if (o) o.style.opacity = '0'; }}>
          <img src={avatarUrl(profile)} alt="Avatar" style={avatarStyle} />
          <div style={avatarOverlayStyle} data-overlay><Camera size={32} color="#fff" /></div>
          <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        </div>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '28px', fontFamily: "'Playfair Display', serif", fontWeight: '700', margin: '0 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {profile?.display_name || 'Profile'}
            {profile?.is_verified && <BadgeCheck size={24} color="var(--gold)" />}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text2)', margin: '0' }}>{user?.email}</p>
          {profile?.pronouns && <p style={{ fontSize: '13px', color: 'var(--text2)', margin: '4px 0 0' }}>{profile.pronouns}</p>}
          {profile?.relationship_style && <div style={{ marginTop: '8px' }}><span className="tag tag-purple">{profile.relationship_style}</span></div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '16px' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent)' }}>{stats.connections}</div><div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>Connections</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent)' }}>{stats.profileViews}</div><div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>Views</div></div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={contentStyle}>
        {error && <div style={{ color: 'var(--danger)', fontSize: '14px', padding: '12px 16px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
        {success && <div style={{ color: 'var(--success)', fontSize: '14px', padding: '12px 16px', background: 'rgba(126, 196, 146, 0.15)', borderRadius: 'var(--radius-sm)', fontWeight: '600' }}>{success}</div>}

        {/* ════ EDIT MODE ════ */}
        {isEditing ? (
          <>
            {/* Basic Info */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Basic Info</h3></div>
              <div style={{ ...cardBodyStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={formGroupStyle}><label style={labelStyle}>Display Name</label>{renderInput('display_name', 'Your display name')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Bio</label><textarea style={textareaStyle} value={editForm.bio || ''} onChange={e => setField('bio', e.target.value)} placeholder="Tell others about yourself..." onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} /></div>
                <div style={formGroupStyle}><label style={labelStyle}>Gender</label>{renderSelect('gender', GENDER_OPTIONS, 'Select gender')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Pronouns</label>{renderInput('pronouns', 'e.g. she/her, they/them')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Date of Birth</label>{renderInput('birth_date', '', 'date')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Fun Fact</label>{renderInput('fun_fact', 'Something interesting about you')}</div>
              </div>
            </div>

            {/* Location */}
            <div style={{ ...cardStyle, overflow: 'visible' }}>
              <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Location</h3></div>
              <div style={{ ...cardBodyStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>City</label>
                  <LocationAutocomplete
                    value={editForm.location_city || ''}
                    onChange={val => setField('location_city', val)}
                    onSelect={s => {
                      const parts = s.display.split(',');
                      const city = parts[0]?.trim();
                      const approx = parts.length > 1 ? parts.slice(0, 2).join(',').trim() : city;
                      setEditForm(prev => ({ ...prev, location_city: city, location_approx: approx, latitude: s.lat, longitude: s.lon }));
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Relationship & Identity */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Relationship & Identity</h3></div>
              <div style={{ ...cardBodyStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={formGroupStyle}><label style={labelStyle}>Relationship Style</label>{renderSelect('relationship_style', RELATIONSHIP_STYLES, 'Select style')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Orientation</label>{renderInput('orientation', 'e.g. Bisexual, Pansexual')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Experience Level</label>{renderSelect('experience_level', EXPERIENCE_LEVELS, 'Select experience')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Partner Status</label>{renderSelect('partner_status', PARTNER_STATUS_OPTIONS, 'Select status')}</div>
              </div>
            </div>

            {/* Lifestyle */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Lifestyle</h3></div>
              <div style={{ ...cardBodyStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={formGroupStyle}><label style={labelStyle}>Occupation</label>{renderInput('occupation', 'Your occupation')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Education</label>{renderInput('education', 'e.g. Bachelor\'s in Psychology')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Height (cm)</label>{renderInput('height_cm', 'e.g. 175', 'number')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Body Type</label>{renderSelect('body_type', BODY_TYPE_OPTIONS, 'Select body type')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Ethnicity</label>{renderInput('ethnicity', 'Your ethnicity')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Smoking</label>{renderSelect('smoking', SMOKING_OPTIONS, 'Select')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Drinking</label>{renderSelect('drinking', DRINKING_OPTIONS, 'Select')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Children</label>{renderSelect('children', CHILDREN_OPTIONS, 'Select')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Available Time</label>{renderSelect('available_time', AVAILABLE_TIME_OPTIONS, 'Select')}</div>
                <div style={formGroupStyle}><label style={labelStyle}>Communication Style</label>{renderSelect('communication_style', COMMUNICATION_STYLES, 'Select style')}</div>
              </div>
            </div>

            {/* Interests & Desires (pill pickers) */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Interests & Preferences</h3></div>
              <div style={{ ...cardBodyStyle, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <PillPicker label="Interests" options={INTEREST_OPTIONS} selected={editForm.interests || []} onChange={v => setField('interests', v)} allowCustom />
                <PillPicker label="Looking For" options={LOOKING_FOR_OPTIONS} selected={editForm.looking_for || []} onChange={v => setField('looking_for', v)} allowCustom />
                <PillPicker label="Love Languages" options={LOVE_LANGUAGE_OPTIONS} selected={editForm.love_languages || []} onChange={v => setField('love_languages', v)} />
                <PillPicker label="Languages" options={LANGUAGE_OPTIONS} selected={editForm.languages || []} onChange={v => setField('languages', v)} allowCustom />
                <PillPicker label="Desires" options={['Intimacy', 'Adventure', 'Companionship', 'Play', 'Romance', 'Kink', 'Emotional Depth', 'Growth']} selected={editForm.desires || []} onChange={v => setField('desires', v)} allowCustom />
                <PillPicker label="Hard Limits" options={[]} selected={editForm.hard_limits || []} onChange={v => setField('hard_limits', v)} allowCustom />
              </div>
            </div>

            {/* Boundaries */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Boundaries</h3></div>
              <div style={{ ...cardBodyStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Boundaries Note</label>
                  <textarea style={textareaStyle} value={editForm.boundaries_note || ''} onChange={e => setField('boundaries_note', e.target.value)} placeholder="Anything you want others to know about your boundaries..." onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>
            </div>

            {/* Save / Cancel buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSaveProfile} disabled={saving}
                style={{ flex: 2, padding: '16px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: '#fff', border: 'none', borderRadius: 'var(--radius-lg)', fontWeight: '700', fontSize: '16px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}>
                {saving ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={16} /> Save Profile</>}
              </button>
              <button onClick={() => setIsEditing(false)} disabled={saving}
                style={{ flex: 1, padding: '16px', background: 'transparent', color: 'var(--text2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          /* ════ VIEW MODE ════ */
          <>
            {/* Edit Profile Button */}
            <button onClick={() => setIsEditing(true)}
              style={{ width: '100%', padding: '14px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-lg)', color: 'var(--accent)', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Edit3 size={16} /> Edit Profile
            </button>

            {/* About Card */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>About</h3></div>
              <div style={cardBodyStyle}>
                {profile?.bio && <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text2)', margin: '0 0 16px' }}>{profile.bio}</p>}
                {profile?.fun_fact && <p style={{ fontSize: '14px', color: 'var(--text2)', margin: '0 0 16px', fontStyle: 'italic' }}>"{profile.fun_fact}"</p>}
                <div style={{ fontSize: '14px' }}>
                  {[
                    ['Gender', profile?.gender],
                    ['Pronouns', profile?.pronouns],
                    ['Age', profile?.age],
                    ['Relationship Style', profile?.relationship_style],
                    ['Orientation', profile?.orientation],
                    ['Partner Status', profile?.partner_status],
                    ['Experience', profile?.experience_level],
                    ['Location', profile?.location_city],
                    ['Occupation', profile?.occupation],
                    ['Education', profile?.education],
                    ['Height', profile?.height_cm ? `${profile.height_cm} cm` : null],
                    ['Body Type', profile?.body_type],
                    ['Ethnicity', profile?.ethnicity],
                    ['Smoking', profile?.smoking],
                    ['Drinking', profile?.drinking],
                    ['Children', profile?.children],
                    ['Available', profile?.available_time],
                    ['Communication', profile?.communication_style],
                  ].filter(([, v]) => v).map(([label, value], i, arr) => (
                    <div key={label} style={i === arr.length - 1 ? infoRowLastStyle : infoRowStyle}>
                      <span style={infoLabelStyle}>{label}</span>
                      <span style={infoValueStyle}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Photo Gallery */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Photo Gallery</h3></div>
              <div style={cardBodyStyle}>
                {pendingRequests.length > 0 && (
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '12px' }}>PENDING ACCESS REQUESTS</p>
                    {pendingRequests.map(req => (
                      <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <img src={avatarUrl(req.requester)} alt={req.requester.display_name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--accent)' }} />
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>{req.requester.display_name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[{l:'30m',v:30},{l:'1h',v:60},{l:'Perm',v:999999}].map(d => (
                            <button key={d.v}
                              onClick={() => setSelectedDuration({ ...selectedDuration, [req.id]: selectedDuration[req.id] === d.v ? null : d.v })}
                              style={{ padding: '6px 10px', fontSize: '12px', background: selectedDuration[req.id] === d.v ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${selectedDuration[req.id] === d.v ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', color: selectedDuration[req.id] === d.v ? 'var(--accent)' : 'var(--text2)', cursor: 'pointer' }}>
                              {d.l}
                            </button>
                          ))}
                          <button onClick={() => handleApproveAccess(req.id, selectedDuration[req.id] || 30)} disabled={!selectedDuration[req.id]}
                            style={{ padding: '6px 10px', fontSize: '12px', background: 'rgba(126, 196, 146, 0.15)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', cursor: 'pointer' }}>
                            <Check size={14} />
                          </button>
                          <button onClick={() => handleDeclineAccess(req.id)}
                            style={{ padding: '6px 10px', fontSize: '12px', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer' }}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={photoGridStyle}>
                  {[...publicPhotos, ...privatePhotos].map(photo => (
                    <div key={photo.id} style={photoItemStyle}
                      onMouseEnter={e => { const o = e.currentTarget.querySelector('[data-overlay]'); if (o) o.style.opacity = '1'; }}
                      onMouseLeave={e => { const o = e.currentTarget.querySelector('[data-overlay]'); if (o) o.style.opacity = '0'; }}
                      onClick={() => setLightboxPhoto(photo)}>
                      <img src={photo.url} alt="Gallery" style={photoImageStyle} />
                      {photo.is_private && <div style={photoLockBadgeStyle}><Lock size={12} /> Private</div>}
                      <div style={photoOverlayStyle} data-overlay>
                        <div style={{ display: 'flex', gap: '8px', width: '100%', padding: '8px', position: 'absolute', bottom: 0 }}>
                          <button style={{ flex: 1, padding: '6px 8px', fontSize: '12px', background: 'var(--accent-dim)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            onClick={e => { e.stopPropagation(); handleTogglePhotoPrivacy(photo.id, photo.is_private); }}>
                            {photo.is_private ? <Eye size={12} /> : <Lock size={12} />}
                          </button>
                          <button style={{ padding: '6px 8px', fontSize: '12px', background: 'var(--danger-dim)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={e => { e.stopPropagation(); handleDeletePhoto(photo.id); }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {photos.length < 15 && (
                    <label style={{ ...photoItemStyle, cursor: 'pointer' }}>
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
                        <Plus size={32} />
                      </div>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '12px' }}>{publicPhotos.length}/5 public &middot; {privatePhotos.length}/10 private</p>
              </div>
            </div>

            {/* Interests */}
            {profile?.interests && profile.interests.length > 0 && (
              <div style={cardStyle}>
                <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Interests</h3></div>
                <div style={cardBodyStyle}><div style={pillContainerStyle}>{profile.interests.map(i => <span key={i} style={pillStyle}>{i}</span>)}</div></div>
              </div>
            )}

            {/* Looking For */}
            {profile?.looking_for && profile.looking_for.length > 0 && (
              <div style={cardStyle}>
                <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Looking For</h3></div>
                <div style={cardBodyStyle}><div style={pillContainerStyle}>{profile.looking_for.map(i => <span key={i} style={pillStyle}>{i}</span>)}</div></div>
              </div>
            )}

            {/* Love Languages */}
            {profile?.love_languages && profile.love_languages.length > 0 && (
              <div style={cardStyle}>
                <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Love Languages</h3></div>
                <div style={cardBodyStyle}><div style={pillContainerStyle}>{profile.love_languages.map(i => <span key={i} style={pillStyle}>{i}</span>)}</div></div>
              </div>
            )}

            {/* Languages */}
            {profile?.languages && profile.languages.length > 0 && (
              <div style={cardStyle}>
                <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Languages</h3></div>
                <div style={cardBodyStyle}><div style={pillContainerStyle}>{profile.languages.map(i => <span key={i} style={pillStyle}>{i}</span>)}</div></div>
              </div>
            )}

            {/* Desires */}
            {profile?.desires && profile.desires.length > 0 && (
              <div style={cardStyle}>
                <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Desires</h3></div>
                <div style={cardBodyStyle}><div style={pillContainerStyle}>{profile.desires.map(i => <span key={i} style={pillStyle}>{i}</span>)}</div></div>
              </div>
            )}

            {/* Boundaries */}
            {profile?.boundaries_note && (
              <div style={cardStyle}>
                <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Boundaries</h3></div>
                <div style={cardBodyStyle}><p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text2)', margin: 0 }}>{profile.boundaries_note}</p></div>
              </div>
            )}

            {/* Hard Limits */}
            {profile?.hard_limits && profile.hard_limits.length > 0 && (
              <div style={cardStyle}>
                <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Hard Limits</h3></div>
                <div style={cardBodyStyle}><div style={pillContainerStyle}>{profile.hard_limits.map(i => <span key={i} style={{ ...pillStyle, background: 'var(--danger-dim)', color: 'var(--danger)' }}>{i}</span>)}</div></div>
              </div>
            )}

            {/* Voice Note */}
            <VoiceNoteCard user={user} profile={profile} />

            {/* Visibility Mode */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Profile Visibility</h3></div>
              <div style={cardBodyStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  {profile?.visibility_mode === 'discreet' ? <Lock size={20} color="#f07860" /> : profile?.visibility_mode === 'open' ? <Globe size={20} color="var(--success)" /> : <UserIcon size={20} color="var(--accent)" />}
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', textTransform: 'capitalize' }}>{profile?.visibility_mode || 'standard'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                      {profile?.visibility_mode === 'discreet' ? 'Photo blurred, maximum privacy' : profile?.visibility_mode === 'open' ? 'Visible to all verified members' : 'Photo unlocks after mutual connection'}
                    </div>
                  </div>
                </div>
                <button onClick={() => navigate('/privacy-settings')}
                  style={{ padding: '12px 20px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-lg)', color: 'var(--accent)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}>
                  <Eye size={16} /> Change Visibility
                </button>
              </div>
            </div>

            {/* Verification */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Verification</h3></div>
              <div style={cardBodyStyle}>
                {profile?.is_verified ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--success)' }}><BadgeCheck size={24} /><span style={{ fontWeight: '600' }}>Verified</span></div>
                ) : (
                  <button onClick={() => navigate('/verify')}
                    style={{ padding: '12px 20px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: '#fff', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}>
                    <Shield size={16} /> Get Verified
                  </button>
                )}
              </div>
            </div>

            {/* Settings */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}><h3 style={cardTitleStyle}>Settings</h3></div>
              <div style={cardBodyStyle}>
                <button onClick={() => navigate('/safety')}
                  style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px', marginBottom: '12px', paddingBottom: '12px' }}>
                  <span>Safety & Privacy</span><ChevronRight size={18} color="var(--text2)" />
                </button>
                <button onClick={() => signOut().then(() => navigate('/login'))}
                  style={{ width: '100%', padding: '12px 28px', background: 'transparent', color: 'var(--text)', border: '1.5px solid rgba(240, 120, 96, 0.3)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }} onClick={() => setLightboxPhoto(null)}>
          <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLightboxPhoto(null)}>
            <X size={24} />
          </button>
          <img src={lightboxPhoto.url} alt="Lightbox" style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
