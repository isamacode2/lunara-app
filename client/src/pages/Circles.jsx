import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getCircles,
  getMyCircles,
  joinCircle,
  leaveCircle,
  getCircleFeed,
  createPost,
  deletePost,
  toggleLike,
  getReplies,
  createReply,
  subscribeToCircle,
  unsubscribeFromCircle,
} from '../lib/circles';
import { supabase } from '../lib/supabase';
import { avatarUrl, timeAgo } from '../lib/utils';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  Plus,
  EyeOff,
  Loader,
  Users,
  Lock,
} from 'lucide-react';

export default function Circles() {
  const { user } = useAuth();
  const [view, setView] = useState('list'); // 'list' or 'feed'
  const [activeCircle, setActiveCircle] = useState(null);
  const [myCircles, setMyCircles] = useState([]);
  const [allCircles, setAllCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposeName, setProposeName] = useState('');
  const [proposeDescription, setProposeDescription] = useState('');
  const [proposing, setProposing] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [replyAnonymous, setReplyAnonymous] = useState({});
  const [userLikes, setUserLikes] = useState({});
  const [circleChannel, setCircleChannel] = useState(null);
  const [joiningCircleId, setJoiningCircleId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  async function openProfilePreview(userId) {
    if (!userId || userId === user?.id) return;
    setProfileLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio, pronouns, relationship_style, experience_level, partner_status, communication_style, interests')
        .eq('id', userId)
        .single();
      if (data) setProfilePreview(data);
    } catch (err) {
      console.log('Profile fetch error:', err);
    } finally {
      setProfileLoading(false);
    }
  }

  // Load initial data
  useEffect(() => {
    if (!user?.id) return;
    loadCircles();
  }, [user?.id]);

  async function loadCircles() {
    setLoading(true);
    setError(null);
    try {
      const [myData, allData] = await Promise.all([
        getMyCircles(user.id),
        getCircles(),
      ]);

      if (myData.error) throw myData.error;
      if (allData.error) throw allData.error;

      setMyCircles(myData.data || []);
      setAllCircles(allData.data || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleJoinCircle(circleId) {
    setJoiningCircleId(circleId);
    setError(null);
    try {
      const { error } = await joinCircle(circleId, user.id);
      if (error) throw error;

      // Optimistic update: move circle from discover to myCircles
      const joined = allCircles.find(c => c.id === circleId);
      if (joined) {
        const updated = { ...joined, member_count: (joined.member_count || 0) + 1 };
        setMyCircles(prev => [...prev, updated]);
        setAllCircles(prev => prev.map(c => c.id === circleId ? updated : c));
      }

      setSuccessMessage(`Joined ${joined?.name || 'circle'}!`);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoiningCircleId(null);
    }
  }

  async function handleLeaveCircle(circleId) {
    try {
      const { error } = await leaveCircle(circleId, user.id);
      if (error) throw error;
      await loadCircles();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleProposeCircle() {
    if (!proposeName.trim() || !proposeDescription.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setProposing(true);
    setError(null);
    try {
      const { error: insertError } = await supabase
        .from('circles')
        .insert({
          name: proposeName.trim(),
          description: proposeDescription.trim(),
          icon: '🌙',
          created_by: user.id,
          is_default: false,
          member_count: 1,
        });

      if (insertError) throw insertError;

      // Auto-join the circle
      const { data: circles } = await getCircles();
      const newCircle = circles?.find(
        c =>
          c.name === proposeName.trim() &&
          c.description === proposeDescription.trim()
      );

      if (newCircle) {
        await joinCircle(newCircle.id, user.id);
      }

      setProposeName('');
      setProposeDescription('');
      setShowProposeModal(false);
      await loadCircles();
    } catch (err) {
      setError(err.message);
    }
    setProposing(false);
  }

  async function openCircleFeed(circle) {
    setActiveCircle(circle);
    setView('feed');
    setFeedLoading(true);
    setError(null);

    try {
      const { data: feedData, error: feedError } = await getCircleFeed(
        circle.id
      );
      if (feedError) throw feedError;
      setFeed(feedData || []);

      // Load user's likes
      const { data: likesData } = await supabase
        .from('circle_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in(
          'post_id',
          feedData?.map(p => p.id) || []
        );

      const likesMap = {};
      likesData?.forEach(like => {
        likesMap[like.post_id] = true;
      });
      setUserLikes(likesMap);

      // Subscribe to new posts — enrich with profile data
      const channel = subscribeToCircle(circle.id, async (post) => {
        // Fetch author profile for display name
        let authorName = null;
        let authorAvatar = null;
        if (post.author_id) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', post.author_id)
            .single();
          if (prof) {
            authorName = prof.display_name;
            authorAvatar = prof.avatar_url;
          }
        }
        const enrichedPost = { ...post, author_name: authorName, author_avatar: authorAvatar };
        setFeed(prev => {
          // Prevent duplicates
          if (prev.some(p => p.id === enrichedPost.id)) return prev;
          return [enrichedPost, ...prev];
        });
      });
      setCircleChannel(channel);
    } catch (err) {
      setError(err.message);
    }
    setFeedLoading(false);
  }

  function closeCircleFeed() {
    if (circleChannel) {
      unsubscribeFromCircle(circleChannel);
      setCircleChannel(null);
    }
    setView('list');
    setActiveCircle(null);
    setFeed([]);
    setExpandedReplies(null);
    setReplyText({});
    setReplyAnonymous({});
    setUserLikes({});
  }

  async function handleCreatePost() {
    if (!newPostContent.trim()) return;

    setPosting(true);
    setError(null);
    try {
      const { data, error } = await createPost(
        activeCircle.id,
        user.id,
        newPostContent,
        isAnonymous
      );
      if (error) throw error;

      setNewPostContent('');
      setIsAnonymous(false);
      // Don't add to feed here — realtime subscription will handle it
    } catch (err) {
      setError(err.message);
    }
    setPosting(false);
  }

  async function handleToggleLike(postId) {
    try {
      const { liked } = await toggleLike(postId, user.id);
      setUserLikes(prev => ({
        ...prev,
        [postId]: liked,
      }));

      // Update feed
      setFeed(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                like_count: liked
                  ? (post.like_count || 0) + 1
                  : Math.max(0, (post.like_count || 0) - 1),
              }
            : post
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function expandReplies(postId) {
    try {
      const { data: repliesData, error } = await getReplies(postId);
      if (error) throw error;
      setExpandedReplies(postId);
      // Store replies in post object
      setFeed(prev =>
        prev.map(post =>
          post.id === postId ? { ...post, _replies: repliesData } : post
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateReply(postId) {
    if (!replyText[postId]?.trim()) return;

    try {
      const { data, error } = await createReply(
        postId,
        user.id,
        replyText[postId],
        replyAnonymous[postId] || false
      );
      if (error) throw error;

      const { data: updatedReplies } = await getReplies(postId);

      setFeed(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                reply_count: (post.reply_count || 0) + 1,
                _replies: updatedReplies,
              }
            : post
        )
      );

      setReplyText(prev => ({
        ...prev,
        [postId]: '',
      }));
      setReplyAnonymous(prev => ({
        ...prev,
        [postId]: false,
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  // VIEW: Circle List
  if (view === 'list') {
    const discoverCircles = allCircles.filter(
      c => !myCircles.find(my => my.id === c.id)
    );

    return (
      <div style={{ backgroundColor: 'var(--bg)', minHeight: '100%', paddingBottom: '16px' }}>
        {/* Welcome Header */}
        <div style={{
          background: 'var(--bg2)',
          borderBottomLeftRadius: '28px',
          borderBottomRightRadius: '28px',
          paddingTop: '24px',
          paddingBottom: '12px',
          paddingLeft: '20px',
          paddingRight: '20px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--ink)' }}>Circles</h1>
          <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0 }}>Calm, moderated spaces for honest conversation</p>
        </div>

        {successMessage && (
          <div style={{
            margin: '12px 20px 0',
            padding: '12px 16px',
            background: 'rgba(126, 196, 146, 0.15)',
            borderRadius: 'var(--radius-sm)',
            color: '#7ec492',
            fontSize: '14px',
            fontWeight: '600',
            textAlign: 'center',
          }}>
            {successMessage}
          </div>
        )}

        {error && (
          <div style={{
            margin: '12px 20px 0',
            padding: '12px 16px',
            background: 'rgba(255, 80, 80, 0.15)',
            borderRadius: 'var(--radius-sm)',
            color: '#ff5050',
            fontSize: '14px',
            fontWeight: '600',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '60px 20px',
          }}>
            <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text2)' }}>Loading circles...</p>
          </div>
        ) : (
          <div style={{ padding: '16px 20px' }}>
            {myCircles.length > 0 ? (
              <>
                {myCircles.map(circle => (
                  <div
                    key={circle.id}
                    onClick={() => openCircleFeed(circle)}
                    style={{
                      background: 'var(--bg2)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--accent-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        flexShrink: 0,
                      }}>
                        {circle.icon || '◎'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 2px 0', color: 'var(--ink)' }}>
                          {circle.name}
                        </h3>
                        <p style={{ fontSize: '12px', margin: '2px 0', color: 'var(--text2)' }}>
                          {circle.member_count || 1} members
                        </p>
                        <p style={{ fontSize: '11px', margin: '2px 0 0 0', fontWeight: '600', color: 'var(--accent)' }}>
                          Moderated · Safe space
                        </p>
                      </div>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                    </div>
                    {circle.description && (
                      <p style={{ fontSize: '13px', margin: '0', color: 'var(--text2)', lineHeight: '1.5' }}>
                        {circle.description}
                      </p>
                    )}
                    <div style={{
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border)',
                      textAlign: 'right',
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)' }}>Enter Circle →</span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                paddingTop: '60px',
                paddingBottom: '60px',
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--accent-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  margin: '0 auto 16px',
                }}>
                  ◎
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 8px 0' }}>Find your community</h2>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text2)',
                  lineHeight: '1.6',
                  marginBottom: '16px',
                }}>
                  Circles are moderated spaces for honest conversation, shared learning, and mutual support.
                </p>
                <button
                  onClick={() => setShowProposeModal(true)}
                  style={{
                    padding: '12px 28px',
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
                  Propose a Circle
                </button>
              </div>
            )}

            {/* Browse all section */}
            {myCircles.length > 0 && discoverCircles.length > 0 && (
              <>
                <h2 style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: 'var(--text2)',
                  marginTop: '32px',
                  marginBottom: '12px',
                }}>
                  Browse All
                </h2>
                {discoverCircles.map(circle => (
                  <div
                    key={circle.id}
                    style={{
                      background: 'var(--bg2)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px',
                      marginBottom: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--accent-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        flexShrink: 0,
                      }}>
                        {circle.icon || '◎'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 2px 0', color: 'var(--ink)' }}>
                          {circle.name}
                        </h3>
                        <p style={{ fontSize: '12px', margin: '2px 0', color: 'var(--text2)' }}>
                          {circle.member_count || 1} members
                        </p>
                        <p style={{ fontSize: '11px', margin: '2px 0 0 0', fontWeight: '600', color: 'var(--accent)' }}>
                          Moderated · Safe space
                        </p>
                      </div>
                      <button
                        onClick={() => handleJoinCircle(circle.id)}
                        disabled={joiningCircleId === circle.id}
                        style={{
                          padding: '7px 18px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--accent)',
                          color: '#fff',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontFamily: 'Outfit, sans-serif',
                          opacity: joiningCircleId === circle.id ? 0.6 : 1,
                        }}
                      >
                        {joiningCircleId === circle.id ? 'Joining...' : 'Join'}
                      </button>
                    </div>
                    {circle.description && (
                      <p style={{ fontSize: '13px', margin: '0', color: 'var(--text2)', lineHeight: '1.5' }}>
                        {circle.description}
                      </p>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Propose Circle Modal */}
        {showProposeModal && (
          <div
            className="modal-overlay"
            onClick={() => !proposing && setShowProposeModal(false)}
          >
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Propose a Circle</h3>

              <div className="form-group">
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                  }}
                >
                  Circle Name
                </label>
                <input
                  type="text"
                  value={proposeName}
                  onChange={e => setProposeName(e.target.value)}
                  placeholder="e.g., Book Club, Game Night"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--bg-elevated)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  disabled={proposing}
                />
              </div>

              <div className="form-group">
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                  }}
                >
                  Description
                </label>
                <textarea
                  value={proposeDescription}
                  onChange={e => setProposeDescription(e.target.value)}
                  placeholder="What's this circle about?"
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    background: 'var(--bg-elevated)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '14px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                  disabled={proposing}
                />
              </div>

              {error && (
                <div className="msg-error" style={{ marginBottom: '16px' }}>
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowProposeModal(false)}
                  disabled={proposing}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleProposeCircle}
                  disabled={
                    proposing ||
                    !proposeName.trim() ||
                    !proposeDescription.trim()
                  }
                >
                  {proposing ? (
                    <>
                      <Loader size={16} className="spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Circle
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW: Circle Feed
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg)' }}>
      {/* Fixed Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px',
        justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={closeCircleFeed}
            style={{ background: 'transparent', color: 'var(--text)', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', margin: 0, fontWeight: 600 }}>{activeCircle?.name}</h1>
            <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{activeCircle?.member_count || 1} members</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '13px', flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Fixed Post Composer */}
      <div style={{
        padding: '16px 20px', flexShrink: 0, borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <textarea
            value={newPostContent} onChange={e => setNewPostContent(e.target.value)}
            placeholder="Share your thoughts..." disabled={posting}
            style={{
              minHeight: '80px', resize: 'none', fontFamily: 'Outfit, sans-serif', fontSize: '14px',
              padding: '12px', background: 'var(--bg-elevated)', border: '1.5px solid var(--border)',
              borderRadius: '12px', color: 'var(--text)', boxSizing: 'border-box', width: '100%',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setIsAnonymous(!isAnonymous)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: isAnonymous ? 'var(--primary)' : 'var(--text2)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, padding: '6px 8px' }}>
              <EyeOff size={16} />
              {isAnonymous ? 'Anonymous' : 'Show name'}
            </button>
            <button onClick={handleCreatePost} disabled={posting || !newPostContent.trim()}
              style={{
                padding: '8px 20px', borderRadius: '20px', border: 'none', fontSize: '13px', fontWeight: '700',
                background: (posting || !newPostContent.trim()) ? 'var(--accent-dim)' : 'var(--primary)',
                color: (posting || !newPostContent.trim()) ? 'var(--text3)' : '#fff',
                cursor: (posting || !newPostContent.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
              {posting ? <><Loader size={14} className="spin" /> Posting...</> : <><Send size={14} /> Post</>}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {feedLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px 0' }}>
            <Loader size={32} className="spin" />
            <p style={{ color: 'var(--text2)' }}>Loading feed...</p>
          </div>
        ) : feed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <MessageCircle size={48} style={{ color: 'var(--text2)' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>No posts yet</h2>
            <p style={{ color: 'var(--text2)' }}>Be the first to share something</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
            {feed.map(post => (
              <div key={post.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '16px', padding: '20px',
              }}>
                {/* Post Header */}
                <div
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', cursor: post.is_anonymous ? 'default' : 'pointer' }}
                  onClick={() => !post.is_anonymous && post.author_id && openProfilePreview(post.author_id)}
                >
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                    background: post.author_avatar ? 'transparent' : 'var(--accent-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {post.is_anonymous ? (
                      <Lock size={18} color="var(--text2)" />
                    ) : post.author_avatar ? (
                      <img src={post.author_avatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent)' }}>
                        {(post.author_name || '?')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      {post.is_anonymous ? (
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text2)' }}>Anonymous</span>
                      ) : (
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{post.author_name || 'Unknown'}</span>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{timeAgo(post.created_at)}</span>
                  </div>
                </div>

                {/* Post Content */}
                <p style={{ fontSize: '14px', margin: '0 0 16px 0', lineHeight: '1.6', color: 'var(--text)' }}>
                  {post.content}
                </p>

                {/* Post Actions */}
                <div style={{ display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => handleToggleLike(post.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: userLikes[post.id] ? 'var(--primary)' : 'var(--text2)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, padding: '4px 8px' }}>
                    <Heart size={16} fill={userLikes[post.id] ? 'currentColor' : 'none'} />
                    {post.like_count || 0}
                  </button>
                  <button onClick={() => expandedReplies === post.id ? setExpandedReplies(null) : expandReplies(post.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: expandedReplies === post.id ? 'var(--primary)' : 'var(--text2)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, padding: '4px 8px' }}>
                    <MessageCircle size={16} fill={expandedReplies === post.id ? 'currentColor' : 'none'} />
                    {post.reply_count || 0}
                  </button>
                </div>

                {/* Expanded Replies */}
                {expandedReplies === post.id && (
                  <div style={{ paddingTop: '12px', marginTop: '8px', borderTop: '1px solid var(--border)' }}>
                    {post._replies && post._replies.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
                        {post._replies.map(reply => (
                          <div key={reply.id} style={{ paddingLeft: '12px', borderLeft: '2px solid var(--border-focus)', display: 'flex', gap: '8px' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                              background: 'var(--accent-dim)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {reply.is_anonymous ? (
                                <Lock size={14} color="var(--text3)" />
                              ) : (
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text2)' }}>
                                  {(reply.author?.display_name || '?')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: reply.is_anonymous ? 'var(--text2)' : 'var(--text)' }}>
                                {reply.is_anonymous ? 'Anonymous' : (reply.author?.display_name || 'Unknown')}
                              </span>
                              <p style={{ fontSize: '13px', margin: '4px 0 0', color: 'var(--text)', lineHeight: '1.4' }}>{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Input */}
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      <input type="text" value={replyText[post.id] || ''}
                        onChange={e => setReplyText(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Reply..."
                        style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                      <button onClick={() => handleCreateReply(post.id)}
                        style={{ background: 'transparent', color: 'var(--primary)', border: 'none', cursor: replyText[post.id]?.trim() ? 'pointer' : 'not-allowed', opacity: replyText[post.id]?.trim() ? 1 : 0.5, padding: '8px', display: 'flex', alignItems: 'center' }}
                        disabled={!replyText[post.id]?.trim()}>
                        <Send size={16} />
                      </button>
                    </div>
                    <button onClick={() => setReplyAnonymous(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: replyAnonymous[post.id] ? 'var(--primary)' : 'var(--text2)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, padding: '4px 8px' }}>
                      <EyeOff size={14} />
                      {replyAnonymous[post.id] ? 'Anonymous' : 'Show name'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Preview Modal */}
      {profilePreview && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 200,
          }}
          onClick={() => setProfilePreview(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)', borderRadius: '20px', padding: '24px', maxWidth: '360px',
              width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                background: profilePreview.avatar_url ? 'transparent' : 'var(--accent-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {profilePreview.avatar_url ? (
                  <img src={profilePreview.avatar_url} alt="" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--accent)' }}>
                    {(profilePreview.display_name || '?')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--ink)' }}>{profilePreview.display_name}</div>
                {profilePreview.pronouns && (
                  <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{profilePreview.pronouns}</div>
                )}
              </div>
            </div>

            {profilePreview.bio && (
              <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text)', margin: '0 0 14px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                {profilePreview.bio}
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              {profilePreview.relationship_style && (
                <span style={{ padding: '4px 10px', borderRadius: '9999px', background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '12px', fontWeight: '600' }}>
                  {profilePreview.relationship_style}
                </span>
              )}
              {profilePreview.experience_level && (
                <span style={{ padding: '4px 10px', borderRadius: '9999px', background: 'var(--sage-light)', color: 'var(--sage)', fontSize: '12px', fontWeight: '600' }}>
                  {profilePreview.experience_level}
                </span>
              )}
              {profilePreview.partner_status && (
                <span style={{ padding: '4px 10px', borderRadius: '9999px', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: '12px', fontWeight: '600' }}>
                  {profilePreview.partner_status}
                </span>
              )}
            </div>

            {profilePreview.interests && profilePreview.interests.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                {profilePreview.interests.slice(0, 6).map(interest => (
                  <span key={interest} style={{ padding: '3px 8px', borderRadius: '9999px', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: '11px' }}>
                    {interest}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => setProfilePreview(null)}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg3)',
                border: 'none', fontSize: '14px', fontWeight: '600', color: 'var(--ink)', cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
