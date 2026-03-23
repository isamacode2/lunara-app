import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getMyPhotos, uploadProfilePhoto, deleteProfilePhoto, togglePhotoPrivacy, getPendingPhotoRequests, approvePhotoAccess, declinePhotoAccess } from '../lib/photos';
import { avatarUrl, timeAgo } from '../lib/utils';
import { Camera, LogOut, Save, Loader, Edit3, MapPin, Heart, Shield, Lock, Unlock, Eye, EyeOff, Plus, X, Check, AlertTriangle, ChevronRight, Trash2, Clock, BadgeCheck, ExternalLink, Mic, MicOff, Play, Square, Globe, User as UserIcon } from 'lucide-react';

const pageStyle = {
  height: '100%',
  overflowY: 'auto',
};

const headerContainerStyle = {
  padding: '24px 20px 20px',
  background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg) 100%)',
};

const avatarContainerStyle = {
  position: 'relative',
  width: '100px',
  height: '100px',
  margin: '0 auto 16px',
  cursor: 'pointer',
};

const avatarStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  border: '3px solid var(--accent)',
  objectFit: 'cover',
  display: 'block',
};

const avatarOverlayStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.5)',
  borderRadius: '50%',
  opacity: 0,
  transition: 'opacity 0.2s',
};

const avatarContainerHoverStyle = {
  ...avatarContainerStyle,
};

const headerTextStyle = {
  textAlign: 'center',
  marginBottom: '12px',
};

const displayNameStyle = {
  fontSize: '28px',
  fontFamily: "'Playfair Display', serif",
  fontWeight: '700',
  margin: '0 0 4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
};

const emailStyle = {
  fontSize: '14px',
  color: 'var(--text2)',
  margin: '0',
};

const statsContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '32px',
  marginTop: '16px',
};

const statItemStyle = {
  textAlign: 'center',
};

const statNumberStyle = {
  fontSize: '20px',
  fontWeight: '700',
  color: 'var(--accent)',
};

const statLabelStyle = {
  fontSize: '12px',
  color: 'var(--text2)',
  marginTop: '4px',
};

const contentStyle = {
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
};

const cardHeaderStyle = {
  padding: '16px 20px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const cardTitleStyle = {
  fontSize: '16px',
  fontWeight: '600',
  fontFamily: "'Playfair Display', serif",
};

const cardBodyStyle = {
  padding: '20px',
};

const infoRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '16px',
  borderBottom: '1px solid var(--border)',
};

const infoRowLastStyle = {
  ...infoRowStyle,
  borderBottom: 'none',
  paddingBottom: '0',
};

const infoLabelStyle = {
  fontSize: '13px',
  fontWeight: '500',
  color: 'var(--text2)',
};

const infoValueStyle = {
  fontSize: '15px',
  color: 'var(--text)',
  textAlign: 'right',
  flex: 1,
  marginLeft: '12px',
};

const photoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '12px',
  marginBottom: '16px',
};

const photoItemStyle = {
  position: 'relative',
  aspectRatio: '1',
  borderRadius: 'var(--radius-sm)',
  overflow: 'hidden',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  cursor: 'pointer',
};

const photoImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const photoOverlayStyle = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.2s',
  color: '#fff',
};

const photoLockBadgeStyle = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  background: 'rgba(0,0,0,0.7)',
  padding: '4px 8px',
  borderRadius: 'var(--radius-sm)',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '11px',
  fontWeight: '600',
};

const addPhotoButtonStyle = {
  aspectRatio: '1',
  borderRadius: 'var(--radius-sm)',
  border: '2px dashed var(--border)',
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text2)',
  transition: 'all 0.2s',
};

const pillContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
};

const pillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--accent-dim)',
  color: 'var(--accent)',
  fontSize: '13px',
  fontWeight: '600',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle = {
  fontSize: '13px',
  fontWeight: '500',
  color: 'var(--text2)',
};

const inputStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: '15px',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  padding: '12px 14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  width: '100%',
};

const textareaStyle = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical',
  fontFamily: "'Outfit', sans-serif",
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239e95a9' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: '36px',
};

const buttonGroupStyle = {
  display: 'flex',
  gap: '12px',
  marginTop: '12px',
};

const requestItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  background: 'var(--bg-elevated)',
  borderRadius: 'var(--radius-sm)',
  marginBottom: '8px',
  border: '1px solid var(--border)',
};

const requesterInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flex: 1,
};

const requesterAvatarStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '1.5px solid var(--accent)',
};

const requesterNameStyle = {
  fontSize: '14px',
  fontWeight: '600',
};

const requestActionsStyle = {
  display: 'flex',
  gap: '8px',
};

const photoActionButtonStyle = {
  padding: '6px 12px',
  fontSize: '12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

const durationButtonStyle = {
  padding: '8px 12px',
  fontSize: '12px',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text2)',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const durationButtonActiveStyle = {
  ...durationButtonStyle,
  background: 'var(--accent-dim)',
  borderColor: 'var(--accent)',
  color: 'var(--accent)',
};

const approveButtonStyle = {
  ...photoActionButtonStyle,
  background: 'rgba(126, 196, 146, 0.15)',
  borderColor: 'var(--success)',
  color: 'var(--success)',
};

const declineButtonStyle = {
  ...photoActionButtonStyle,
  background: 'var(--danger-dim)',
  borderColor: 'var(--danger)',
  color: 'var(--danger)',
};

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
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Upload to supabase
        try {
          setUploading(true);
          const path = `${user.id}/voice_intro_${Date.now()}.webm`;
          const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'audio/webm' });
          if (!upErr) {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
            await supabase.from('profiles').update({
              voice_intro_url: publicUrl + '?t=' + Date.now(),
              has_voice_intro: true,
            }).eq('id', user.id);
          }
        } catch (err) {
          console.error('Voice upload failed:', err);
        } finally {
          setUploading(false);
        }
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setRecording(false);
    }
  }

  function playAudio() {
    if (!audioUrl) return;
    if (audioRef.current) { audioRef.current.pause(); }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.play();
    setPlaying(true);
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', fontFamily: "'Playfair Display', serif" }}>Voice Note</h3>
        {uploading && <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />}
      </div>
      <div style={{ padding: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px', lineHeight: '1.5' }}>
          Record a short voice intro so potential connections can hear your voice before matching.
        </p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {audioUrl && !recording && (
            <button
              onClick={playing ? stopAudio : playAudio}
              style={{
                padding: '12px 20px',
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              {playing ? <><Square size={16} /> Stop</> : <><Play size={16} /> Play</>}
            </button>
          )}
          <button
            onClick={recording ? stopRecording : startRecording}
            style={{
              padding: '12px 20px',
              background: recording ? 'var(--danger-dim)' : 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              border: recording ? '1px solid var(--danger)' : 'none',
              borderRadius: 'var(--radius-lg)',
              color: recording ? 'var(--danger)' : '#fff',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: audioUrl && !recording ? 1 : undefined,
              width: audioUrl && !recording ? undefined : '100%',
              justifyContent: 'center',
            }}
          >
            {recording ? (
              <><MicOff size={16} /> Stop Recording</>
            ) : audioUrl ? (
              <><Mic size={16} /> Re-record</>
            ) : (
              <><Mic size={16} /> Record Voice Note</>
            )}
          </button>
        </div>
        {recording && (
          <div style={{
            marginTop: '12px', padding: '12px',
            background: 'var(--danger-dim)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: 'var(--danger)',
              animation: 'pulse 1.5s infinite',
            }} />
            <span style={{ fontSize: '13px', color: 'var(--danger)' }}>Recording...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, profile, uploadAvatar, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [stats, setStats] = useState({ connections: 0, profileViews: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState({});
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    relationship_style: '',
    location_city: '',
    orientation: '',
    occupation: '',
    experience_level: '',
  });

  const relationshipStyleOptions = [
    'Polyamorous',
    'Open Relationship',
    'Relationship Anarchy',
    'Swinging',
    'Mono-Poly',
    'Exploring ENM',
    'Other',
  ];

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user?.id]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Load photos
      const { data: photosData } = await getMyPhotos(user.id);
      setPhotos(photosData || []);

      // Load pending requests
      const { data: requestsData } = await getPendingPhotoRequests(user.id);
      setPendingRequests(requestsData || []);

      // Load stats
      const { data: connectionsData } = await supabase
        .from('connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');
      const { data: viewsData } = await supabase
        .from('profile_views')
        .select('id')
        .eq('viewed_user_id', user.id);

      setStats({
        connections: connectionsData?.length || 0,
        profileViews: viewsData?.length || 0,
      });

      // Initialize edit form
      if (profile) {
        setEditForm({
          display_name: profile.display_name || '',
          bio: profile.bio || '',
          relationship_style: profile.relationship_style || '',
          location_city: profile.location_city || '',
          orientation: profile.orientation || '',
          occupation: profile.occupation || '',
          experience_level: profile.experience_level || '',
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      await uploadAvatar(file);
      setSuccess('Avatar updated!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const publicPhotos = photos.filter(p => !p.is_private);
      const isPrivate = publicPhotos.length >= 5;

      const { data, error: uploadErr } = await uploadProfilePhoto(user.id, file, isPrivate, photos.length);
      if (uploadErr) throw uploadErr;

      setPhotos([...photos, data]);
      setSuccess(`Photo uploaded as ${isPrivate ? 'private' : 'public'}!`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeletePhoto(photoId) {
    if (!confirm('Delete this photo?')) return;

    try {
      setError(null);
      await deleteProfilePhoto(photoId);
      setPhotos(photos.filter(p => p.id !== photoId));
      setSuccess('Photo deleted');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to delete photo');
    }
  }

  async function handleTogglePhotoPrivacy(photoId, isPrivate) {
    try {
      setError(null);
      const newPrivacy = !isPrivate;
      const publicPhotos = photos.filter(p => !p.is_private && p.id !== photoId);

      if (!newPrivacy && publicPhotos.length >= 5) {
        setError('Maximum 5 public photos allowed');
        return;
      }

      await togglePhotoPrivacy(photoId, newPrivacy);
      setPhotos(photos.map(p => p.id === photoId ? { ...p, is_private: newPrivacy } : p));
      setSuccess(`Photo marked as ${newPrivacy ? 'private' : 'public'}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to update photo');
    }
  }

  async function handleApproveAccess(requestId, durationMin) {
    try {
      setError(null);
      await approvePhotoAccess(requestId, durationMin);
      setPendingRequests(pendingRequests.filter(r => r.id !== requestId));
      setSuccess('Access approved!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to approve access');
    }
  }

  async function handleDeclineAccess(requestId) {
    try {
      setError(null);
      await declinePhotoAccess(requestId);
      setPendingRequests(pendingRequests.filter(r => r.id !== requestId));
      setSuccess('Access declined');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to decline access');
    }
  }

  async function handleSaveAbout() {
    try {
      setError(null);
      await updateProfile(editForm);
      setIsEditingAbout(false);
      setSuccess('Profile updated!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile');
    }
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center' }}>
          <Loader style={{ animation: 'spin 1s linear infinite' }} size={40} color="var(--accent)" />
        </div>
      </div>
    );
  }

  const publicPhotos = photos.filter(p => !p.is_private);
  const privatePhotos = photos.filter(p => p.is_private);

  return (
    <div style={pageStyle}>
      <div style={headerContainerStyle}>
        <div
          style={avatarContainerHoverStyle}
          onMouseEnter={(e) => {
            e.currentTarget.querySelector('[data-overlay]').style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.querySelector('[data-overlay]').style.opacity = '0';
          }}
        >
          <img
            src={avatarUrl(profile)}
            alt="Avatar"
            style={avatarStyle}
          />
          <div style={avatarOverlayStyle} data-overlay>
            <Camera size={32} color="#fff" />
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={uploading}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          />
        </div>

        <div style={headerTextStyle}>
          <h1 style={displayNameStyle}>
            {profile?.display_name || 'Profile'}
            {profile?.is_verified && <BadgeCheck size={24} color="var(--gold)" />}
          </h1>
          <p style={emailStyle}>{user?.email}</p>
          {profile?.relationship_style && (
            <div style={{ marginTop: '8px' }}>
              <span className="tag tag-purple">{profile.relationship_style}</span>
            </div>
          )}
        </div>

        <div style={statsContainerStyle}>
          <div style={statItemStyle}>
            <div style={statNumberStyle}>{stats.connections}</div>
            <div style={statLabelStyle}>Connections</div>
          </div>
          <div style={statItemStyle}>
            <div style={statNumberStyle}>{stats.profileViews}</div>
            <div style={statLabelStyle}>Views</div>
          </div>
        </div>
      </div>

        <div style={contentStyle}>
          {error && <div style={{ color: 'var(--danger)', fontSize: '14px', padding: '12px 16px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
          {success && <div style={{ color: 'var(--success)', fontSize: '14px', padding: '12px 16px', background: 'rgba(126, 196, 146, 0.15)', borderRadius: 'var(--radius-sm)' }}>{success}</div>}

          {/* About Card */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>About</h3>
              {!isEditingAbout && (
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setIsEditingAbout(true)}
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>
            <div style={cardBodyStyle}>
              {isEditingAbout ? (
                <div style={formStyle}>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Display Name</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>

                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Bio</label>
                    <textarea
                      style={textareaStyle}
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                      placeholder="Tell others about yourself..."
                    />
                  </div>

                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Relationship Style</label>
                    <select
                      style={selectStyle}
                      value={editForm.relationship_style}
                      onChange={(e) => setEditForm({ ...editForm, relationship_style: e.target.value })}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    >
                      <option value="">Select relationship style</option>
                      {relationshipStyleOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Location</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={editForm.location_city}
                      onChange={(e) => setEditForm({ ...editForm, location_city: e.target.value })}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                      placeholder="City, State"
                    />
                  </div>

                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Orientation</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={editForm.orientation}
                      onChange={(e) => setEditForm({ ...editForm, orientation: e.target.value })}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                      placeholder="e.g., Bisexual"
                    />
                  </div>

                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Occupation</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={editForm.occupation}
                      onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                      placeholder="Your occupation"
                    />
                  </div>

                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Experience Level</label>
                    <select
                      style={selectStyle}
                      value={editForm.experience_level}
                      onChange={(e) => setEditForm({ ...editForm, experience_level: e.target.value })}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    >
                      <option value="">Select experience level</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Some Experience">Some Experience</option>
                      <option value="Experienced">Experienced</option>
                      <option value="Very Experienced">Very Experienced</option>
                    </select>
                  </div>

                  <div style={buttonGroupStyle}>
                    <button
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-lg)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                      onClick={handleSaveAbout}
                    >
                      <Save size={16} /> Save
                    </button>
                    <button
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'transparent',
                        color: 'var(--text2)',
                        border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                      onClick={() => setIsEditingAbout(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {profile?.bio && (
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text2)', margin: 0 }}>{profile.bio}</p>
                    </div>
                  )}

                  <div style={{ fontSize: '14px' }}>
                    {profile?.relationship_style && (
                      <div style={infoRowStyle}>
                        <span style={infoLabelStyle}>Relationship Style</span>
                        <span style={infoValueStyle}>{profile.relationship_style}</span>
                      </div>
                    )}
                    {profile?.orientation && (
                      <div style={infoRowStyle}>
                        <span style={infoLabelStyle}>Orientation</span>
                        <span style={infoValueStyle}>{profile.orientation}</span>
                      </div>
                    )}
                    {profile?.location_city && (
                      <div style={infoRowStyle}>
                        <span style={infoLabelStyle}>Location</span>
                        <span style={infoValueStyle}>{profile.location_city}</span>
                      </div>
                    )}
                    {profile?.occupation && (
                      <div style={infoRowStyle}>
                        <span style={infoLabelStyle}>Occupation</span>
                        <span style={infoValueStyle}>{profile.occupation}</span>
                      </div>
                    )}
                    {profile?.experience_level && (
                      <div style={infoRowLastStyle}>
                        <span style={infoLabelStyle}>Experience</span>
                        <span style={infoValueStyle}>{profile.experience_level}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Photo Gallery */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Photo Gallery</h3>
            </div>
            <div style={cardBodyStyle}>
              {pendingRequests.length > 0 && (
                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '12px' }}>PENDING ACCESS REQUESTS</p>
                  {pendingRequests.map(req => (
                    <div key={req.id} style={requestItemStyle}>
                      <div style={requesterInfoStyle}>
                        <img
                          src={avatarUrl(req.requester)}
                          alt={req.requester.display_name}
                          style={requesterAvatarStyle}
                        />
                        <span style={requesterNameStyle}>{req.requester.display_name}</span>
                      </div>
                      <div style={requestActionsStyle}>
                        <button
                          style={durationButtonStyle}
                          onClick={() => setSelectedDuration({ ...selectedDuration, [req.id]: selectedDuration[req.id] === 30 ? null : 30 })}
                          onMouseEnter={(e) => {
                            if (selectedDuration[req.id] === 30) {
                              e.target.style.background = 'var(--accent-dim)';
                              e.target.style.borderColor = 'var(--accent)';
                              e.target.style.color = 'var(--accent)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedDuration[req.id] !== 30) {
                              e.target.style.background = 'transparent';
                              e.target.style.borderColor = 'var(--border)';
                              e.target.style.color = 'var(--text2)';
                            }
                          }}
                        >
                          30m
                        </button>
                        <button
                          style={durationButtonStyle}
                          onClick={() => setSelectedDuration({ ...selectedDuration, [req.id]: selectedDuration[req.id] === 60 ? null : 60 })}
                          onMouseEnter={(e) => {
                            if (selectedDuration[req.id] === 60) {
                              e.target.style.background = 'var(--accent-dim)';
                              e.target.style.borderColor = 'var(--accent)';
                              e.target.style.color = 'var(--accent)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedDuration[req.id] !== 60) {
                              e.target.style.background = 'transparent';
                              e.target.style.borderColor = 'var(--border)';
                              e.target.style.color = 'var(--text2)';
                            }
                          }}
                        >
                          1h
                        </button>
                        <button
                          style={durationButtonStyle}
                          onClick={() => setSelectedDuration({ ...selectedDuration, [req.id]: selectedDuration[req.id] === 999999 ? null : 999999 })}
                          onMouseEnter={(e) => {
                            if (selectedDuration[req.id] === 999999) {
                              e.target.style.background = 'var(--accent-dim)';
                              e.target.style.borderColor = 'var(--accent)';
                              e.target.style.color = 'var(--accent)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedDuration[req.id] !== 999999) {
                              e.target.style.background = 'transparent';
                              e.target.style.borderColor = 'var(--border)';
                              e.target.style.color = 'var(--text2)';
                            }
                          }}
                        >
                          Perm
                        </button>
                        <button
                          style={approveButtonStyle}
                          onClick={() => handleApproveAccess(req.id, selectedDuration[req.id] || 30)}
                          disabled={!selectedDuration[req.id]}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          style={declineButtonStyle}
                          onClick={() => handleDeclineAccess(req.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={photoGridStyle}>
                {[...publicPhotos, ...privatePhotos].map(photo => (
                  <div
                    key={photo.id}
                    style={photoItemStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.querySelector('[data-overlay]').style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.querySelector('[data-overlay]').style.opacity = '0';
                    }}
                    onClick={() => setLightboxPhoto(photo)}
                  >
                    <img src={photo.url} alt="Gallery" style={photoImageStyle} />
                    {photo.is_private && (
                      <div style={photoLockBadgeStyle}>
                        <Lock size={12} /> Private
                      </div>
                    )}
                    <div style={photoOverlayStyle} data-overlay>
                      <div style={{ display: 'flex', gap: '8px', width: '100%', padding: '8px', position: 'absolute', bottom: 0 }}>
                        <button
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '12px',
                            background: 'var(--accent-dim)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePhotoPrivacy(photo.id, photo.is_private);
                          }}
                        >
                          {photo.is_private ? <Eye size={12} /> : <Lock size={12} />}
                        </button>
                        <button
                          style={{
                            padding: '6px 8px',
                            fontSize: '12px',
                            background: 'var(--danger-dim)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo.id);
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {photos.length < 15 && (
                  <label style={{ ...photoItemStyle, cursor: 'pointer' }}>
                    <div style={{ ...addPhotoButtonStyle, width: '100%', height: '100%' }}>
                      <Plus size={32} />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '12px' }}>
                {publicPhotos.length}/5 public • {privatePhotos.length}/10 private
              </p>
            </div>
          </div>

          {/* Interests Card */}
          {profile?.interests && profile.interests.length > 0 && (
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <h3 style={cardTitleStyle}>Interests</h3>
              </div>
              <div style={cardBodyStyle}>
                <div style={pillContainerStyle}>
                  {profile.interests.map(interest => (
                    <span key={interest} style={pillStyle}>{interest}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Looking For Card */}
          {profile?.looking_for && profile.looking_for.length > 0 && (
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <h3 style={cardTitleStyle}>Looking For</h3>
              </div>
              <div style={cardBodyStyle}>
                <div style={pillContainerStyle}>
                  {profile.looking_for.map(item => (
                    <span key={item} style={pillStyle}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Voice Note Card */}
          <VoiceNoteCard user={user} profile={profile} />

          {/* Visibility Mode Card */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Profile Visibility</h3>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                {profile?.visibility_mode === 'discreet' ? (
                  <Lock size={20} color="#f07860" />
                ) : profile?.visibility_mode === 'open' ? (
                  <Globe size={20} color="var(--success)" />
                ) : (
                  <UserIcon size={20} color="var(--accent)" />
                )}
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', textTransform: 'capitalize' }}>
                    {profile?.visibility_mode || 'standard'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                    {profile?.visibility_mode === 'discreet'
                      ? 'Photo blurred, maximum privacy'
                      : profile?.visibility_mode === 'open'
                      ? 'Visible to all verified members'
                      : 'Photo unlocks after mutual connection'}
                  </div>
                </div>
              </div>
              <button
                style={{
                  padding: '12px 20px',
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  justifyContent: 'center',
                }}
                onClick={() => navigate('/privacy-settings')}
              >
                <Eye size={16} /> Change Visibility
              </button>
            </div>
          </div>

          {/* Verification Card */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Verification</h3>
            </div>
            <div style={cardBodyStyle}>
              {profile?.is_verified ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--success)' }}>
                  <BadgeCheck size={24} />
                  <span style={{ fontWeight: '600' }}>Verified</span>
                </div>
              ) : (
                <button
                  style={{
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'center',
                  }}
                  onClick={() => navigate('/verify')}
                >
                  <Shield size={16} /> Get Verified
                </button>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Settings</h3>
            </div>
            <div style={cardBodyStyle}>
              <button
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '15px',
                  marginBottom: '12px',
                  paddingBottom: '12px',
                }}
                onClick={() => navigate('/safety')}
              >
                <span>Safety & Privacy</span>
                <ChevronRight size={18} color="var(--text2)" />
              </button>

              <button
                style={{
                  width: '100%',
                  padding: '12px 28px',
                  background: 'transparent',
                  color: 'var(--text)',
                  border: '1.5px solid rgba(240, 120, 96, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '16px',
                }}
                onClick={() => signOut().then(() => navigate('/login'))}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: '20px',
          }}
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setLightboxPhoto(null)}
          >
            <X size={24} />
          </button>
          <img
            src={lightboxPhoto.url}
            alt="Lightbox"
            style={{
              maxWidth: '90%',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 'var(--radius-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
