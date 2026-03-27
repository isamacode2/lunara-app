import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Sparkles, BookOpen, ArrowRight, Loader } from 'lucide-react';

export default function Home() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [circles, setCircles] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [stats, setStats] = useState({
    circleCount: 0,
    completedGuides: 0,
  });
  const [loading, setLoading] = useState(true);

  document.title = 'Lunara';

  // Get time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.display_name?.split(' ')[0] || 'there';

  // Get relative date for reflections
  const getRelativeDate = (isoDate) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Fetch active challenge
  const fetchActiveChallenge = useCallback(async (userId) => {
    try {
      const { data, error: err } = await supabase
        .from('challenge_progress')
        .select('*, challenges(*)')
        .eq('user_id', userId)
        .is('completed_at', null)
        .order('started_at', { ascending: false })
        .limit(1);

      if (err) throw err;

      if (data && data.length > 0) {
        const progress = data[0];
        const challenge = progress.challenges;
        if (challenge) {
          const remaining = challenge.duration_days - progress.current_day + 1;
          setActiveChallenge({
            ...progress,
            challenge: challenge,
            promptsRemaining: remaining > 0 ? remaining : 0,
          });
        }
      } else {
        setActiveChallenge(null);
      }
    } catch (err) {
      console.log('Challenge fetch info:', err?.code);
      setActiveChallenge(null);
    }
  }, []);

  // Fetch user's circles
  const fetchCircles = useCallback(async (userId) => {
    try {
      const { data, error: err } = await supabase
        .from('circle_members')
        .select(`
          id,
          circle_id,
          circles (
            id,
            name,
            emoji,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (err) throw err;

      const circleData = data
        ? data.map((item) => item.circles).filter(Boolean)
        : [];
      setCircles(circleData);
    } catch (err) {
      console.log('Error fetching circles:', err);
    }
  }, []);

  // Fetch recent reflections
  const fetchReflections = useCallback(async (userId) => {
    try {
      const { data, error: err } = await supabase
        .from('reflections')
        .select('id, user_id, prompt, response, tags, challenge_id, day_number, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2);

      if (err) throw err;

      setReflections(data || []);
    } catch (err) {
      console.log('Reflections fetch:', err?.code);
    }
  }, []);

  // Fetch community stats
  const fetchStats = useCallback(async (userId) => {
    try {
      // Circle count
      const { count: circleCount, error: circleErr } = await supabase
        .from('circle_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (circleErr) throw circleErr;

      // Completed guides
      const { count: guidesCount, error: guidesErr } = await supabase
        .from('guide_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (guidesErr) throw guidesErr;

      setStats({
        circleCount: circleCount || 0,
        completedGuides: guidesCount || 0,
      });
    } catch (err) {
      console.log('Error fetching stats:', err);
    }
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      await Promise.all([
        fetchActiveChallenge(user.id),
        fetchCircles(user.id),
        fetchReflections(user.id),
        fetchStats(user.id),
      ]);
    } catch (err) {
      console.log('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchActiveChallenge, fetchCircles, fetchReflections, fetchStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="page page-center">
        <Loader size={32} className="spin" />
      </div>
    );
  }

  return (
    <div className="page" style={{ overflow: 'auto', paddingBottom: '16px' }}>
      {/* Welcome Section */}
      <div style={s.welcomeSection}>
        <h1 style={s.welcomeGreeting}>
          {getGreeting()}, {firstName}.
        </h1>
        <p style={s.welcomeSubtext}>What needs your attention today?</p>
      </div>

      {/* Guide CTA Card */}
      <button
        style={s.guideCTACard}
        onClick={() => navigate('/guide')}
        className="hover-lift"
      >
        <div style={s.guideCTAIcon}>✨</div>
        <div style={{ flex: 1, textAlign: 'left', marginLeft: '12px' }}>
          <div style={s.guideCTATitle}>Need help with a situation?</div>
          <div style={s.guideCTASub}>
            Get structured guidance for conversations, boundaries, and more
          </div>
        </div>
        <div style={s.guideCTAArrow}>→</div>
      </button>

      {/* Active Challenge Card */}
      {activeChallenge && activeChallenge.challenge ? (
        <div style={s.challengeCard}>
          <div style={s.challengeHeader}>
            <div style={s.challengeTitle}>{activeChallenge.challenge.title}</div>
            <div style={s.challengeDay}>
              Day {activeChallenge.current_day} of {activeChallenge.challenge.duration_days}
            </div>
          </div>

          <p style={s.challengeDescription}>
            {activeChallenge.challenge.description || 'Continue your reflection journey.'}
          </p>

          <p style={s.challengeMeta}>
            {activeChallenge.promptsRemaining} prompts remaining
          </p>

          <button
            style={s.challengeButton}
            onClick={() => navigate('/reflect')}
          >
            Continue →
          </button>
        </div>
      ) : (
        <div style={s.challengeCard}>
          <div style={s.emptyIcon}>◎</div>
          <h3 style={s.emptyTitle}>Ready to grow?</h3>
          <p style={s.emptyDesc}>
            Build clarity on what matters to you with a 5-day guided challenge.
          </p>

          <div style={s.recommendation}>
            <div style={s.recommendationTitle}>Foundations of ENM</div>
            <div style={s.recommendationSub}>5 days, 10 minutes daily</div>
          </div>

          <button
            style={s.challengeButton}
            onClick={() => navigate('/toolkit')}
          >
            Begin Journey →
          </button>
        </div>
      )}

      {/* Your Circles Horizontal Scroll */}
      {circles.length > 0 && (
        <div style={s.circlesSection}>
          <h3 style={s.sectionHeading}>Your Circles</h3>
          <div style={s.circlesScroll}>
            {circles.map((circle) => (
              <button
                key={circle.id}
                style={s.circlePill}
                onClick={() => navigate(`/circles/${circle.id}`)}
              >
                <span style={s.circleEmoji}>{circle.emoji || '◎'}</span>
                <span style={s.circleName}>{circle.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reflections */}
      <div style={s.reflectionsSection}>
        <h3 style={s.sectionHeading}>Recent Reflections</h3>
        {reflections.length > 0 ? (
          <div>
            {reflections.map((reflection) => {
              const preview = reflection.response
                .substring(0, 60)
                .concat(reflection.response.length > 60 ? '...' : '');
              const relativeDate = getRelativeDate(reflection.created_at);

              return (
                <div key={reflection.id} style={s.reflectionCard}>
                  <div style={s.reflectionHeader}>
                    <div style={s.reflectionPrompt}>
                      {reflection.prompt || 'Free reflection'}
                    </div>
                    <div style={s.reflectionDate}>{relativeDate}</div>
                  </div>
                  <p style={s.reflectionPreview}>{preview}</p>
                  <div style={s.reflectionActions}>
                    <button
                      style={s.reflectionActionButton}
                      onClick={() => navigate('/guide')}
                    >
                      Ask Guide
                    </button>
                    <button
                      style={s.reflectionActionButton}
                      onClick={() => navigate('/toolkit')}
                    >
                      Explore Topic
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={s.emptyState}>
            <p style={s.emptyStateText}>
              Your private reflections appear here. Tap Reflect to capture what's on your mind.
            </p>
          </div>
        )}
      </div>

      {/* Your Progress Strip */}
      <div style={s.progressStrip}>
        <div style={s.progressText}>
          {stats.circleCount} circles · {reflections.length} reflections
        </div>
        <button
          style={s.progressLink}
          onClick={() => navigate('/reflect')}
        >
          View Progress →
        </button>
      </div>

      {/* Stats Section */}
      <div style={s.statsSection}>
        <div style={s.statItem}>
          <div style={s.statItemCount}>{stats.completedGuides}</div>
          <div style={s.statItemLabel}>Resources read</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={s.quickActions}>
        <button style={s.quickActionBtn} onClick={() => navigate('/guide')}>
          Get Guidance
        </button>
        <button style={s.quickActionBtn} onClick={() => navigate('/reflect')}>
          New Reflection
        </button>
        <button style={s.quickActionBtn} onClick={() => navigate('/toolkit')}>
          Browse Toolkit
        </button>
        <button style={s.quickActionBtn} onClick={() => navigate('/circles')}>
          Join a Circle
        </button>
      </div>
    </div>
  );
}

const s = {
  // Welcome section
  welcomeSection: {
    padding: '24px 20px',
    borderBottomLeftRadius: '28px',
    borderBottomRightRadius: '28px',
    background: 'var(--bg2)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
  },
  welcomeGreeting: {
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    margin: 0,
    color: 'var(--ink)',
  },
  welcomeSubtext: {
    fontSize: '15px',
    marginTop: '8px',
    color: 'var(--text2)',
    lineHeight: '22px',
    margin: '8px 0 0 0',
  },

  // Guide CTA Card
  guideCTACard: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 20px 16px 20px',
    padding: '16px',
    borderRadius: '16px',
    background: 'var(--bg2)',
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  guideCTAIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'var(--accent-dim)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0,
  },
  guideCTATitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--ink)',
    marginBottom: '4px',
    margin: 0,
  },
  guideCTASub: {
    fontSize: '13px',
    color: 'var(--text2)',
    lineHeight: '19px',
    margin: '4px 0 0 0',
  },
  guideCTAArrow: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--accent)',
    marginLeft: '12px',
  },

  // Challenge Card
  challengeCard: {
    margin: '12px 20px',
    padding: '16px',
    borderRadius: '16px',
    background: 'var(--bg2)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  challengeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  challengeTitle: {
    fontSize: '18px',
    fontWeight: '700',
    flex: 1,
    color: 'var(--ink)',
    margin: 0,
  },
  challengeDay: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text3)',
    marginLeft: '8px',
  },
  challengeDescription: {
    fontSize: '14px',
    lineHeight: '21px',
    marginBottom: '12px',
    margin: '0 0 12px 0',
    color: 'var(--text2)',
  },
  challengeMeta: {
    fontSize: '13px',
    marginBottom: '12px',
    margin: '0 0 12px 0',
    color: 'var(--text3)',
  },
  challengeButton: {
    paddingTop: '14px',
    paddingBottom: '14px',
    paddingLeft: '16px',
    paddingRight: '16px',
    borderRadius: '12px',
    alignItems: 'center',
    textAlign: 'center',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
  },

  // Empty challenge state
  emptyIcon: {
    width: '72px',
    height: '72px',
    borderRadius: '12px',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: '12px',
    background: 'var(--accent-dim)',
    display: 'flex',
    fontSize: '36px',
    color: 'var(--accent)',
    margin: '0 auto 12px auto',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '8px',
    margin: '0 0 8px 0',
    color: 'var(--ink)',
  },
  emptyDesc: {
    fontSize: '14px',
    textAlign: 'center',
    lineHeight: '21px',
    marginBottom: '16px',
    margin: '0 0 16px 0',
    color: 'var(--text2)',
  },
  recommendation: {
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
    background: 'var(--bg)',
  },
  recommendationTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--ink)',
    margin: 0,
  },
  recommendationSub: {
    fontSize: '13px',
    marginTop: '4px',
    margin: '4px 0 0 0',
    color: 'var(--text3)',
  },

  // Circles section
  circlesSection: {
    marginBottom: '16px',
    marginLeft: '20px',
    marginRight: '20px',
  },
  sectionHeading: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--ink)',
    margin: '0 0 12px 0',
  },
  circlesScroll: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  circlePill: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px',
    borderRadius: '20px',
    background: 'var(--bg2)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  circleEmoji: {
    fontSize: '18px',
    marginRight: '8px',
  },
  circleName: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--ink)',
  },

  // Reflections section
  reflectionsSection: {
    marginBottom: '16px',
    marginLeft: '20px',
    marginRight: '20px',
  },
  reflectionCard: {
    background: 'var(--bg2)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
  },
  reflectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  reflectionPrompt: {
    fontSize: '14px',
    fontWeight: '700',
    flex: 1,
    color: 'var(--ink)',
  },
  reflectionDate: {
    fontSize: '12px',
    color: 'var(--text3)',
    marginLeft: '8px',
  },
  reflectionPreview: {
    fontSize: '13px',
    lineHeight: '20px',
    marginBottom: '12px',
    margin: '0 0 12px 0',
    color: 'var(--text2)',
  },
  reflectionActions: {
    display: 'flex',
    gap: '12px',
  },
  reflectionActionButton: {
    paddingTop: '8px',
    paddingBottom: '8px',
    paddingLeft: '12px',
    paddingRight: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--accent)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  emptyState: {
    background: 'var(--bg2)',
    borderRadius: '12px',
    padding: '16px',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: '14px',
    color: 'var(--text2)',
    margin: 0,
    textAlign: 'center',
    lineHeight: '21px',
  },

  // Your Progress Strip
  progressStrip: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '12px 20px',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px',
    borderRadius: '12px',
    background: 'var(--bg2)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
  },
  progressText: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--ink)',
  },
  progressLink: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--accent)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 14px',
    borderRadius: '20px',
    transition: 'opacity 0.2s',
  },

  // Stats section
  statsSection: {
    margin: '16px 20px',
    display: 'flex',
    gap: '16px',
  },
  statItem: {
    flex: 1,
  },
  statItemCount: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--accent)',
  },
  statItemLabel: {
    fontSize: '11px',
    marginTop: '2px',
    color: 'var(--text3)',
  },

  // Quick actions
  quickActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    margin: '16px 20px 0 20px',
  },
  quickActionBtn: {
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    background: 'var(--bg2)',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--ink)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
  },
};
