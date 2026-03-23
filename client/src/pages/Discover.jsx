import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDiscoverProfiles, sendConnection, passProfile } from '../lib/discovery';
import { avatarUrl } from '../lib/utils';
import { Compass, X, Heart, MapPin, Sparkles, Loader, Send, Lock, EyeOff } from 'lucide-react';

export default function Discover() {
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [intentModal, setIntentModal] = useState(null);
  const [intentText, setIntentText] = useState('');
  const [submittingIntent, setSubmittingIntent] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetchProfiles();
  }, [user?.id]);

  async function fetchProfiles() {
    setLoading(true);
    setError(null);
    const { data, error } = await getDiscoverProfiles(user.id);
    if (error) {
      setError(error.message);
    } else {
      setProfiles(data || []);
      setCurrentIndex(0);
    }
    setLoading(false);
  }

  function calculateCompatibility(currentProfile, targetProfile) {
    let score = 50;
    if (currentProfile?.relationship_style === targetProfile?.relationship_style) score += 20;
    const myInterests = currentProfile?.interests || [];
    const theirInterests = targetProfile?.interests || [];
    if (myInterests.length > 0 && theirInterests.length > 0) {
      const sharedCount = myInterests.filter(i => theirInterests.includes(i)).length;
      const ratio = sharedCount / Math.max(myInterests.length, theirInterests.length);
      score += Math.round(30 * ratio);
    }
    if (currentProfile?.looking_for?.some(l => targetProfile?.looking_for?.includes(l))) score += 10;
    return Math.min(score, 99);
  }

  async function handlePass() {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;
    await passProfile(user.id, currentProfile.id);
    setCurrentIndex(currentIndex + 1);
  }

  async function handleConnect() {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;
    setIntentModal(currentProfile);
    setIntentText('');
  }

  async function submitIntent() {
    const currentProfile = intentModal;
    if (!currentProfile) return;
    setSubmittingIntent(true);
    const { error } = await sendConnection(user.id, currentProfile.id, intentText);
    if (error) {
      setError(error.message);
    } else {
      setCurrentIndex(currentIndex + 1);
      setIntentModal(null);
      setIntentText('');
    }
    setSubmittingIntent(false);
  }

  if (loading) {
    return (
      <div className="page page-center">
        <Loader size={32} className="spin" />
        <p>Loading profiles...</p>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const noMoreProfiles = currentIndex >= profiles.length;

  if (noMoreProfiles) {
    return (
      <div className="page page-center">
        <Sparkles size={48} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 600 }}>You've seen everyone</h2>
        <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>Check back later for new matches!</p>
        <button className="btn btn-primary" onClick={fetchProfiles}>Refresh</button>
      </div>
    );
  }

  const compatibility = calculateCompatibility(profile, currentProfile);

  // Photo visibility logic matching the mobile app
  const showPhoto = currentProfile.visibility_mode === 'open' || currentProfile.is_mutual_match;
  const isDiscreet = currentProfile.visibility_mode === 'discreet';

  return (
    <div className="page" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Compass size={24} style={{ color: 'var(--accent)' }} />
        <h1 style={{ fontSize: '28px', margin: 0 }}>Discover</h1>
      </div>

      {/* Profile Card Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', overflowY: 'auto' }}>
        {error && <div className="msg-error" style={{ marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

        {currentProfile && (
          <div
            key={currentProfile.id}
            className="anim-in"
            style={{
              width: '100%',
              maxWidth: '340px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            {/* Photo Container */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '4 / 3.5',
                backgroundColor: 'var(--bg)',
                backgroundImage: showPhoto ? `url(${avatarUrl(currentProfile)})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflow: 'hidden',
              }}
            >
              {/* Blurred photo overlay when not visible */}
              {!showPhoto && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  zIndex: 2,
                }}>
                  {/* Blurred background image */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${avatarUrl(currentProfile)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(28px) brightness(0.5)',
                    transform: 'scale(1.1)',
                  }} />

                  {/* Privacy overlay content */}
                  <div style={{
                    position: 'relative',
                    zIndex: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                    }}>
                      {isDiscreet ? <EyeOff size={24} color="#fff" /> : <Lock size={24} color="#fff" />}
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#fff',
                      textAlign: 'center',
                      textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                      padding: '0 20px',
                    }}>
                      {isDiscreet ? 'Discreet — Photo hidden' : 'Photo unlocks after mutual connection'}
                    </span>
                  </div>
                </div>
              )}

              {/* Compatibility Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'var(--gold)',
                  color: '#000',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '14px',
                  fontWeight: '700',
                  boxShadow: '0 4px 16px rgba(255, 190, 85, 0.3)',
                  zIndex: 5,
                }}
              >
                {compatibility}%
              </div>
            </div>

            {/* Profile Info */}
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <h2 style={{ fontSize: '22px', margin: '0 0 8px 0', fontWeight: 600 }}>
                {currentProfile.display_name}, {currentProfile.age}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text2)', marginBottom: '12px', fontSize: '14px' }}>
                <MapPin size={16} />
                {currentProfile.location || 'Location not specified'}
              </div>

              {currentProfile.relationship_style && (
                <div style={{ marginBottom: '12px' }}>
                  <span className="tag tag-purple">{currentProfile.relationship_style}</span>
                </div>
              )}

              <p style={{
                fontSize: '14px', color: 'var(--text2)', marginBottom: '16px',
                display: '-webkit-box', WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1,
              }}>
                {currentProfile.bio || 'No bio provided'}
              </p>

              {currentProfile.interests && currentProfile.interests.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {currentProfile.interests.slice(0, 5).map((interest, idx) => (
                    <span key={idx} className="tag tag-outline">{interest}</span>
                  ))}
                  {currentProfile.interests.length > 5 && (
                    <span className="tag tag-outline">+{currentProfile.interests.length - 5}</span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', padding: '16px', flexShrink: 0 }}>
              <button
                onClick={handlePass}
                style={{
                  flex: 1, padding: '16px', borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--border)', background: 'var(--bg-elevated)',
                  color: 'var(--text2)', fontSize: '16px', fontWeight: '700',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
                }}
              >
                Pass
              </button>
              <button
                onClick={handleConnect}
                style={{
                  flex: 1, padding: '16px', borderRadius: 'var(--radius-lg)',
                  border: 'none', background: 'var(--primary)',
                  color: '#fff', fontSize: '16px', fontWeight: '700',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
                }}
              >
                Connect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Intent Modal */}
      {intentModal && (
        <div className="modal-overlay" onClick={() => !submittingIntent && setIntentModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Share what caught your eye</h3>
            <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '16px' }}>
              Let {intentModal.display_name} know why you're interested
            </p>
            <textarea
              value={intentText}
              onChange={e => setIntentText(e.target.value)}
              placeholder={`Tell ${intentModal.display_name} what caught your eye...`}
              style={{
                minHeight: '120px', resize: 'vertical', fontFamily: 'Outfit, sans-serif',
                fontSize: '14px', padding: '12px', background: 'var(--bg-elevated)',
                border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)',
              }}
              disabled={submittingIntent}
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setIntentModal(null)} disabled={submittingIntent}>Cancel</button>
              <button className="btn btn-primary" onClick={submitIntent} disabled={submittingIntent || !intentText.trim()}>
                {submittingIntent ? (
                  <><Loader size={16} className="spin" /> Sending...</>
                ) : (
                  <><Send size={16} /> Send</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
