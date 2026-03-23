import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Heart, MapPin, Sparkles, Loader } from 'lucide-react';
import './Discover.css';

function compatibilityScore(myProfile, other) {
  let score = 50;
  if (myProfile.relationship_style && other.relationship_style) {
    if (myProfile.relationship_style === other.relationship_style) score += 20;
  }
  const myInterests = myProfile.interests || [];
  const theirInterests = other.interests || [];
  const shared = myInterests.filter(i => theirInterests.includes(i)).length;
  if (myInterests.length > 0 && theirInterests.length > 0) {
    score += Math.min(30, Math.round((shared / Math.max(myInterests.length, 1)) * 30));
  }
  if (myProfile.looking_for && other.looking_for) {
    const myLF = myProfile.looking_for || [];
    const theirLF = other.looking_for || [];
    const sharedLF = myLF.filter(l => theirLF.includes(l)).length;
    if (sharedLF > 0) score += 10;
  }
  return Math.min(99, score);
}

export default function Discover() {
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(null);
  const [noMore, setNoMore] = useState(false);

  const fetchProfiles = useCallback(async () => {
    if (!user) return;

    // Get IDs we've already acted on
    const [{ data: conns }, { data: passed }] = await Promise.all([
      supabase.from('connections').select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
      supabase.from('passes').select('passed_id').eq('user_id', user.id),
    ]);

    const seenIds = new Set([user.id]);
    (conns || []).forEach(c => { seenIds.add(c.sender_id); seenIds.add(c.receiver_id); });
    (passed || []).forEach(p => seenIds.add(p.passed_id));

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('id', 'in', `(${[...seenIds].join(',')})`)
      .not('display_name', 'is', null)
      .limit(20);

    if (!error && data) {
      setProfiles(data);
      setNoMore(data.length === 0);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  async function handleConnect() {
    if (!currentProfile) return;
    setSwiping('right');
    await supabase.from('connections').insert({
      sender_id: user.id,
      receiver_id: currentProfile.id,
      status: 'pending',
    });
    setTimeout(() => advance(), 300);
  }

  async function handlePass() {
    if (!currentProfile) return;
    setSwiping('left');
    await supabase.from('passes').insert({
      user_id: user.id,
      passed_id: currentProfile.id,
    });
    setTimeout(() => advance(), 300);
  }

  function advance() {
    setSwiping(null);
    if (currentIndex + 1 >= profiles.length) {
      setNoMore(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }

  const currentProfile = profiles[currentIndex];
  const score = currentProfile && profile ? compatibilityScore(profile, currentProfile) : 0;

  if (loading) {
    return (
      <div className="discover-page">
        <div className="discover-loading">
          <Loader size={28} className="spin" />
          <p>Finding people near you...</p>
        </div>
      </div>
    );
  }

  if (noMore || !currentProfile) {
    return (
      <div className="discover-page">
        <div className="discover-empty animate-in">
          <Sparkles size={48} color="var(--gold)" />
          <h2>You've seen everyone</h2>
          <p>Check back later for new profiles</p>
          <button className="btn btn-outline" onClick={() => {
            setCurrentIndex(0);
            setNoMore(false);
            setLoading(true);
            fetchProfiles();
          }}>Refresh</button>
        </div>
      </div>
    );
  }

  const avatarUrl = currentProfile.avatar_url
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentProfile.display_name || 'U')}&backgroundColor=3B2070&textColor=F3F0F5`;

  return (
    <div className="discover-page">
      <div className={`profile-card animate-in ${swiping === 'left' ? 'swipe-left' : ''} ${swiping === 'right' ? 'swipe-right' : ''}`}>
        <div className="card-image">
          <img src={avatarUrl} alt={currentProfile.display_name} />
          <div className="card-image-overlay" />
          <div className="card-score">
            <Sparkles size={14} />
            <span>{score}%</span>
          </div>
        </div>

        <div className="card-body">
          <div className="card-header">
            <h2 className="card-name">
              {currentProfile.display_name}
              {currentProfile.age ? <span className="card-age">, {currentProfile.age}</span> : null}
            </h2>
            {currentProfile.location_city && (
              <p className="card-location">
                <MapPin size={14} />
                {currentProfile.location_city}
              </p>
            )}
          </div>

          {currentProfile.relationship_style && (
            <span className="card-tag">{currentProfile.relationship_style}</span>
          )}

          {currentProfile.bio && (
            <p className="card-bio">{currentProfile.bio}</p>
          )}

          {currentProfile.interests && currentProfile.interests.length > 0 && (
            <div className="card-interests">
              {currentProfile.interests.slice(0, 5).map(i => (
                <span key={i} className="interest-tag">{i}</span>
              ))}
            </div>
          )}
        </div>

        <div className="card-actions">
          <button className="btn-action btn-pass" onClick={handlePass}>
            <X size={28} strokeWidth={2.5} />
          </button>
          <button className="btn-action btn-connect" onClick={handleConnect}>
            <Heart size={28} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
