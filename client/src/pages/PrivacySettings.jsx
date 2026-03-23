import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, Loader, Lock, User, Globe, Check } from 'lucide-react';

const VISIBILITY_OPTIONS = [
  {
    value: 'discreet',
    icon: Lock,
    label: 'Discreet',
    description: 'Your photo is blurred by default. Maximum privacy. Only people you connect with can see your photo.',
    color: '#f07860',
  },
  {
    value: 'standard',
    icon: User,
    label: 'Standard',
    description: 'Your profile is visible to other members. Photo unlocks after mutual connection.',
    color: 'var(--accent)',
  },
  {
    value: 'open',
    icon: Globe,
    label: 'Open',
    description: 'Your full profile including photo is visible to all verified members.',
    color: 'var(--success)',
  },
];

export default function PrivacySettings() {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(profile?.visibility_mode || 'standard');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (selected === profile?.visibility_mode) return;
    try {
      setSaving(true);
      await updateProfile({ visibility_mode: selected });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const changed = selected !== (profile?.visibility_mode || 'standard');

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '8px', display: 'flex' }}
          onClick={() => navigate('/profile')}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', margin: 0, fontFamily: "'Playfair Display', serif", fontWeight: '700' }}>
          Profile Visibility
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }}>
        <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div>
            <h2 style={{
              fontSize: '22px', fontWeight: '700', margin: '0 0 8px',
              fontFamily: "'Playfair Display', serif",
            }}>
              Control Who Sees You
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.6', margin: 0 }}>
              Choose how visible your profile is to other members. You can change this at any time.
            </p>
          </div>

          {success && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(126, 196, 146, 0.15)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--success)',
              fontSize: '14px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Check size={16} /> Visibility updated!
            </div>
          )}

          {VISIBILITY_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = selected === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  border: isSelected ? `2px solid ${opt.color}` : '2px solid var(--border)',
                  background: isSelected ? `${opt.color}11` : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: isSelected ? `${opt.color}22` : 'var(--bg-elevated)',
                  border: `1.5px solid ${isSelected ? opt.color : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}>
                  <Icon size={22} color={isSelected ? opt.color : 'var(--text2)'} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: isSelected ? '#fff' : 'var(--text)' }}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: opt.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0, lineHeight: '1.5' }}>
                    {opt.description}
                  </p>
                </div>
              </div>
            );
          })}

          <div style={{
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
          }}>
            <p style={{ fontSize: '13px', color: 'var(--accent)', margin: 0, lineHeight: '1.6' }}>
              Your photos are never shared without your consent. In Standard and Discreet modes, photos only become visible after a mutual connection is established.
            </p>
          </div>

          {changed && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontSize: '16px',
                fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
              ) : (
                'Save Changes'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
