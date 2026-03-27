import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader, Save, X, ChevronRight, LogOut, Moon, Sun } from 'lucide-react';

const PRONOUNS = ['She/Her', 'He/Him', 'They/Them', 'She/They', 'He/They', 'Ze/Zir', 'Ask me'];
const RELATIONSHIP_STYLES = ['Polyamorous', 'Solo poly', 'Kitchen table poly', 'Open relationship', 'Relationship anarchy', 'Exploring / Curious'];
const PARTNER_STATUS = ['Single', 'Partnered — mono transitioning', 'Partnered — open', 'Partnered — poly', 'Multiple partners', "It's complicated"];
const EXPERIENCE_LEVELS = ['New to ENM (< 1 year)', 'Learning (1-2 years)', 'Experienced (3-5 years)', 'Very experienced (5+ years)', 'Prefer not to say'];
const COMMUNICATION_STYLES = ['Direct and honest', 'Gentle and careful', 'Lots of check-ins', 'Space to process', 'Written over verbal', 'Prefer not to say'];
const SUGGESTED_INTERESTS = ['Travel', 'Art', 'Music', 'Cooking', 'Fitness', 'Reading', 'Photography', 'Yoga', 'Nature', 'ENM', 'Mindfulness', 'Dancing', 'Writing', 'Therapy', 'Community'];

function ChipSelector({ options, selected, onSelect, multi = false }) {
  function toggle(val) {
    if (multi) {
      const a = Array.isArray(selected) ? selected : [];
      onSelect(a.includes(val) ? a.filter(v => v !== val) : [...a, val]);
    } else {
      onSelect(val === selected ? '' : val);
    }
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map(o => {
        const active = multi ? (Array.isArray(selected) ? selected : []).includes(o) : selected === o;
        return (
          <button
            key={o}
            onClick={() => toggle(o)}
            style={{
              padding: '9px 14px',
              borderRadius: 'var(--radius-full)',
              background: active ? 'rgba(180, 124, 255, 0.15)' : 'var(--bg2)',
              border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
              color: active ? 'var(--accent)' : 'var(--text2)',
              fontSize: '13px',
              fontWeight: active ? '700' : '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(', ') : value;
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      paddingBottom: '8px',
      marginBottom: '8px',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '500' }}>{label}</span>
      <span style={{
        fontSize: '14px',
        color: 'var(--ink)',
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
        marginLeft: '12px',
        maxWidth: '60%',
      }}>
        {display}
      </span>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg2)',
      borderRadius: 'var(--radius-lg)',
      marginTop: '12px',
      padding: '16px',
    }}>
      <h3 style={{
        fontSize: '10px',
        fontWeight: '800',
        letterSpacing: '1.5px',
        marginBottom: '16px',
        color: 'var(--text2)',
        textTransform: 'uppercase',
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile?.display_name || '',
        bio: profile?.bio || '',
        relationship_style: profile?.relationship_style || '',
        pronouns: profile?.pronouns || '',
        partner_status: profile?.partner_status || '',
        interests: profile?.interests ? profile.interests.join(', ') : '',
        experience_level: profile?.experience_level || '',
        communication_style: profile?.communication_style || '',
        boundaries_note: profile?.boundaries_note || '',
      });
    }
  }, [profile, editing]);

  if (!profile) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg)',
      }}>
        <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (editing) {
    async function handleSave() {
      setLoading(true);
      setError('');
      try {
        const updateData = {
          display_name: form.display_name.trim() || null,
          bio: form.bio.trim() || null,
          relationship_style: form.relationship_style || null,
          pronouns: form.pronouns || null,
          partner_status: form.partner_status || null,
          interests: form.interests ? form.interests.split(',').map(i => i.trim()).filter(Boolean) : [],
          experience_level: form.experience_level || null,
          communication_style: form.communication_style || null,
          boundaries_note: form.boundaries_note.trim() || null,
        };

        const { error: err } = await updateProfile(updateData);
        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }

        setEditing(false);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Something went wrong');
        setLoading(false);
      }
    }

    return (
      <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingBottom: '100px' }}>
        <div style={{
          position: 'sticky',
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg)',
          zIndex: 50,
        }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Edit Profile</h1>
          <button
            onClick={() => setEditing(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {error && (
            <div style={{
              padding: '12px',
              background: 'rgba(255, 80, 80, 0.15)',
              border: '1px solid rgba(255, 80, 80, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#ff5050',
              fontSize: '13px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Display Name */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>
                Display Name
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg2)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--ink)',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Pronouns */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>
                Pronouns
              </label>
              <ChipSelector options={PRONOUNS} selected={form.pronouns} onSelect={v => setForm(p => ({ ...p, pronouns: v }))} />
            </div>

            {/* Bio / About You */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>
                About You
              </label>
              <textarea
                value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="What brings you to Lunara? What are you exploring or learning right now?"
                maxLength={500}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  background: 'var(--bg2)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--ink)',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
              <div style={{ fontSize: '11px', textAlign: 'right', marginTop: '4px', color: 'var(--text2)' }}>
                {(form.bio || '').length}/500
              </div>
            </div>

            {/* Relationship Style */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>
                Relationship Style
              </label>
              <ChipSelector options={RELATIONSHIP_STYLES} selected={form.relationship_style} onSelect={v => setForm(p => ({ ...p, relationship_style: v }))} />
            </div>

            {/* Partner Status */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>
                Partner Status
              </label>
              <ChipSelector options={PARTNER_STATUS} selected={form.partner_status} onSelect={v => setForm(p => ({ ...p, partner_status: v }))} />
            </div>

            {/* Experience Level */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>
                ENM Experience
              </label>
              <ChipSelector options={EXPERIENCE_LEVELS} selected={form.experience_level} onSelect={v => setForm(p => ({ ...p, experience_level: v }))} />
            </div>

            {/* Communication Style */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>
                Communication Preference
              </label>
              <ChipSelector options={COMMUNICATION_STYLES} selected={form.communication_style} onSelect={v => setForm(p => ({ ...p, communication_style: v }))} />
            </div>

            {/* Interests */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>
                Interests
              </label>
              <input
                type="text"
                value={form.interests}
                onChange={e => setForm(p => ({ ...p, interests: e.target.value }))}
                placeholder="Travel, Music, Yoga..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg2)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--ink)',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Boundaries Note */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>
                Boundaries Note
              </label>
              <textarea
                value={form.boundaries_note}
                onChange={e => setForm(p => ({ ...p, boundaries_note: e.target.value }))}
                placeholder="How you approach boundaries in relationships..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  background: 'var(--bg2)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--ink)',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => setEditing(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg2)',
                  color: 'var(--text2)',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  flex: 1.5,
                  padding: '12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? <Loader size={16} /> : <Save size={16} />}
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── DISPLAY VIEW ──
  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Header Card with Avatar */}
      <div style={{
        background: 'var(--bg2)',
        borderBottomLeftRadius: '40px',
        borderBottomRightRadius: '40px',
        paddingTop: '24px',
        paddingBottom: '24px',
        paddingLeft: '20px',
        paddingRight: '20px',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
      }}>
        {/* Avatar */}
        <div style={{
          marginBottom: '16px',
          position: 'relative',
          width: '120px',
          height: '120px',
          margin: '0 auto 16px',
          cursor: 'pointer',
        }}>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: '4px solid var(--bg)',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'var(--bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
            }}>
              🌙
            </div>
          )}
        </div>

        {/* Name & Pronouns */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          margin: '0 0 4px 0',
          color: 'var(--ink)',
        }}>
          {profile.display_name}
        </h1>
        {profile.pronouns && (
          <p style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--accent)',
            margin: '4px 0 8px 0',
          }}>
            {profile.pronouns}
          </p>
        )}

        {/* Bio Preview */}
        {profile.bio && (
          <p style={{
            fontSize: '13px',
            color: 'var(--text2)',
            margin: '8px 0 16px 0',
            fontStyle: 'italic',
            lineHeight: '1.5',
          }}>
            {profile.bio.length > 80 ? profile.bio.substring(0, 80) + '...' : profile.bio}
          </p>
        )}

        {/* Edit Button */}
        <button
          onClick={() => setEditing(true)}
          style={{
            paddingTop: '12px',
            paddingBottom: '12px',
            paddingLeft: '24px',
            paddingRight: '24px',
            borderRadius: 'var(--radius-full)',
            border: `1.5px solid var(--accent)`,
            background: 'transparent',
            color: 'var(--accent)',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          Edit Profile
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* My ENM Journey */}
        {(profile.relationship_style || profile.partner_status || profile.experience_level) && (
          <SectionCard title="My ENM Journey">
            <DetailRow label="Style" value={profile.relationship_style} />
            <DetailRow label="Status" value={profile.partner_status} />
            <DetailRow label="Experience" value={profile.experience_level} />
          </SectionCard>
        )}

        {/* How I Communicate */}
        {profile.communication_style && (
          <SectionCard title="How I Communicate">
            <DetailRow label="Style" value={profile.communication_style} />
          </SectionCard>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <SectionCard title="Interests">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile.interests.map(i => (
                <div
                  key={i}
                  style={{
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    paddingLeft: '14px',
                    paddingRight: '14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(180, 124, 255, 0.15)',
                  }}
                >
                  <span style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: '600' }}>
                    {i}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Boundaries */}
        {profile.boundaries_note && (
          <SectionCard title="Boundaries">
            <p style={{
              fontSize: '15px',
              lineHeight: '24px',
              color: 'var(--text2)',
              margin: 0,
            }}>
              {profile.boundaries_note}
            </p>
          </SectionCard>
        )}

        {/* Theme Settings */}
        <SectionCard title="Theme">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '8px',
            paddingBottom: '8px',
          }}>
            <span style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: '600' }}>Dark Mode</span>
            <button
              onClick={() => {
                const newTheme = theme === 'dark' ? 'light' : 'dark';
                setTheme(newTheme);
                localStorage.setItem('theme', newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--accent)',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </SectionCard>

        {/* Account Section */}
        <div style={{
          background: 'var(--bg2)',
          borderRadius: 'var(--radius-lg)',
          marginTop: '12px',
          overflow: 'hidden',
        }}>
          <h3 style={{
            fontSize: '10px',
            fontWeight: '800',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--text2)',
            padding: '16px 20px 12px',
            margin: 0,
          }}>
            Account
          </h3>

          <button
            onClick={() => navigate('/privacy-settings')}
            style={{
              width: '100%',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--ink)',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(180, 124, 255, 0.05)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            Privacy settings
            <ChevronRight size={18} style={{ color: 'var(--text2)' }} />
          </button>

          <button
            onClick={() => navigate('/safety')}
            style={{
              width: '100%',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--ink)',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(180, 124, 255, 0.05)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            Safety & blocked users
            <ChevronRight size={18} style={{ color: 'var(--text2)' }} />
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to sign out?')) {
                signOut();
              }
            }}
            style={{
              width: '100%',
              padding: '16px 20px',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#ff5050',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255, 80, 80, 0.05)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            Sign out
            <LogOut size={18} style={{ color: '#ff5050' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
