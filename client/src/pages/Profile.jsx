import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Camera, LogOut, Save, Loader } from 'lucide-react';
import './Profile.css';

const RELATIONSHIP_STYLES = [
  'Polyamorous', 'Open Relationship', 'Relationship Anarchy',
  'Swinging', 'Mono-Poly', 'Exploring ENM', 'Other',
];

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    relationship_style: profile?.relationship_style || '',
    location_city: profile?.location_city || '',
    orientation: profile?.orientation || '',
    occupation: profile?.occupation || '',
  });

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile(form);
      setSuccess('Profile updated');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setError('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

    try {
      await updateProfile({ avatar_url: publicUrl + '?t=' + Date.now() });
      setSuccess('Photo updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
    setUploading(false);
  }

  const avatarUrl = profile?.avatar_url
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.display_name || 'U')}&backgroundColor=3B2070&textColor=F3F0F5`;

  return (
    <div className="profile-page">
      <div className="profile-scroll">
        <div className="profile-header animate-in">
          <div className="profile-avatar-wrap" onClick={() => fileRef.current?.click()}>
            <img src={avatarUrl} alt="" className="profile-avatar" />
            <div className="profile-avatar-overlay">
              {uploading ? <Loader size={22} className="spin" /> : <Camera size={22} />}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>
          <h1 className="profile-name">{profile?.display_name || 'Your Profile'}</h1>
          {profile?.relationship_style && (
            <span className="profile-style-tag">{profile.relationship_style}</span>
          )}
          {profile?.email && (
            <p className="profile-email">{profile.email}</p>
          )}
        </div>

        {success && <p className="success-msg" style={{ textAlign: 'center', margin: '8px 0' }}>{success}</p>}
        {error && <p className="error-msg" style={{ textAlign: 'center', margin: '8px 0' }}>{error}</p>}

        <div className="profile-section animate-in">
          <div className="profile-section-header">
            <h3>About You</h3>
            {!editing && (
              <button className="btn btn-ghost" onClick={() => setEditing(true)}>
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="profile-form">
              <div className="form-group">
                <label>Display Name</label>
                <input
                  value={form.display_name}
                  onChange={e => handleChange('display_name', e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={form.bio}
                  onChange={e => handleChange('bio', e.target.value)}
                  placeholder="Tell people about yourself..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Relationship Style</label>
                <select
                  value={form.relationship_style}
                  onChange={e => handleChange('relationship_style', e.target.value)}
                >
                  <option value="">Select style</option>
                  {RELATIONSHIP_STYLES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    value={form.location_city}
                    onChange={e => handleChange('location_city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="form-group">
                  <label>Orientation</label>
                  <input
                    value={form.orientation}
                    onChange={e => handleChange('orientation', e.target.value)}
                    placeholder="e.g. Bisexual"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Occupation</label>
                <input
                  value={form.occupation}
                  onChange={e => handleChange('occupation', e.target.value)}
                  placeholder="What do you do?"
                />
              </div>

              <div className="profile-form-actions">
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-info-list">
              <div className="info-item">
                <span className="info-label">Bio</span>
                <span className="info-value">{profile?.bio || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Style</span>
                <span className="info-value">{profile?.relationship_style || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Location</span>
                <span className="info-value">{profile?.location_city || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Orientation</span>
                <span className="info-value">{profile?.orientation || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Occupation</span>
                <span className="info-value">{profile?.occupation || 'Not set'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="profile-section" style={{ paddingBottom: 100 }}>
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={signOut}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
