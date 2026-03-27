import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader, Plus } from 'lucide-react';

const QUICK_PROMPTS = [
  "What does safety mean to me in relationships?",
  "What conversation have I been avoiding?",
  "What did I learn about myself this week?",
  "How did I show up for my community recently?",
  "What boundary am I proud of holding?",
  "What am I grateful for in my relationships right now?"
];

const TAG_OPTIONS = [
  'communication',
  'boundaries',
  'jealousy',
  'trust',
  'growth',
  'self-awareness'
];

export default function Reflect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [reflections, setReflections] = useState([]);
  const [stats, setStats] = useState({ total: 0, streak: 0, completed: 0 });
  const [showCompose, setShowCompose] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composingFromChallenge, setComposingFromChallenge] = useState(false);
  const [composingFromPrompt, setComposingFromPrompt] = useState(null);
  const [randomPrompts, setRandomPrompts] = useState([]);
  const [filterTag, setFilterTag] = useState(null);

  useEffect(() => {
    load();
  }, [user?.id]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [challengeData, reflectionsData, statsData] = await Promise.all([
        fetchActiveChallenge(),
        fetchReflections(),
        fetchStats()
      ]);
      setActiveChallenge(challengeData);
      setReflections(reflectionsData);
      setStats(statsData);
      setRandomPrompts(getRandomPrompts());
    } catch (error) {
      console.log('Error fetching reflect data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRandomPrompts = () => {
    const shuffled = [...QUICK_PROMPTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  };

  const fetchActiveChallenge = async () => {
    try {
      const { data, error } = await supabase
        .from('challenge_progress')
        .select('*, challenge:challenges(*)')
        .eq('user_id', user.id)
        .is('completed_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.log('No active challenge:', error.code);
        return null;
      }

      if (data) {
        const { data: promptData } = await supabase
          .from('challenge_prompts')
          .select('*')
          .eq('challenge_id', data.challenge.id)
          .eq('day_number', data.current_day)
          .single();

        return { ...data, prompt: promptData };
      }
      return null;
    } catch (error) {
      console.log('Challenge fetch error:', error?.code);
      return null;
    }
  };

  const fetchReflections = async () => {
    try {
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log('Error fetching reflections:', error);
      return [];
    }
  };

  const fetchStats = async () => {
    try {
      const { data: reflectionsData, error: reflError } = await supabase
        .from('reflections')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (reflError) throw reflError;

      const { data: completedData, error: challError } = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      if (challError) throw challError;

      const total = reflectionsData?.length || 0;
      const streak = calculateStreak(reflectionsData || []);
      const completed = completedData?.length || 0;

      return { total, streak, completed };
    } catch (error) {
      console.log('Error fetching stats:', error);
      return { total: 0, streak: 0, completed: 0 };
    }
  };

  const calculateStreak = (reflectionsData) => {
    if (!reflectionsData.length) return 0;

    const dates = reflectionsData
      .map(r => new Date(r.created_at).toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b) - new Date(a));

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const current = new Date(dates[i - 1]);
      const previous = new Date(dates[i]);
      const dayDiff = (current - previous) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const formatStreak = (streak) => {
    if (streak === 0) return 'No streak yet';
    if (streak === 1) return '1-day streak';
    if (streak <= 7) return `${streak}-day streak`;
    if (streak <= 21) return `${Math.ceil(streak / 7)}-week streak`;
    return `${Math.ceil(streak / 30)}-month streak`;
  };

  const openComposeForChallenge = () => {
    setComposingFromChallenge(true);
    setShowCompose(true);
    setSelectedTags([]);
    setComposeText('');
  };

  const openComposeForPrompt = (prompt) => {
    setComposingFromPrompt(prompt);
    setShowCompose(true);
    setSelectedTags([]);
    setComposeText('');
  };

  const openFreeWrite = () => {
    setComposingFromChallenge(false);
    setComposingFromPrompt(null);
    setShowCompose(true);
    setSelectedTags([]);
    setComposeText('');
  };

  const handleSaveReflection = async () => {
    if (!composeText.trim()) return;

    try {
      setIsSubmitting(true);

      const { error: insertError } = await supabase
        .from('reflections')
        .insert([{
          user_id: user.id,
          response: composeText,
          tags: selectedTags,
          prompt: composingFromPrompt,
          challenge_id: composingFromChallenge ? activeChallenge?.challenge_id : null,
          day_number: composingFromChallenge ? activeChallenge?.current_day : null
        }]);

      if (insertError) throw insertError;

      if (composingFromChallenge && activeChallenge) {
        const newDay = activeChallenge.current_day + 1;
        const isCompleted = newDay > activeChallenge.challenge.duration_days;

        const updateData = {
          current_day: newDay
        };

        if (isCompleted) {
          updateData.completed_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('challenge_progress')
          .update(updateData)
          .eq('id', activeChallenge.id);

        if (updateError) throw updateError;
      }

      setShowCompose(false);
      setComposeText('');
      setSelectedTags([]);
      setComposingFromChallenge(false);
      setComposingFromPrompt(null);
      await load();
    } catch (error) {
      console.log('Error saving reflection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={s.centerPage}>
        <Loader size={32} className="spin" />
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.scrollContent}>
        {/* Header */}
        <div style={s.headerSection}>
          <h1 style={s.headerTitle}>Your Reflections</h1>
          <p style={s.headerSubtext}>A private space to process, prepare, and grow</p>
        </div>

        {/* Active Challenge */}
        {activeChallenge && activeChallenge.prompt && (
          <div style={s.challengeCard}>
            <div style={s.challengeHeader}>
              <div>
                <h3 style={s.challengeTitle}>{activeChallenge.challenge.title}</h3>
                <div style={s.challengeMeta}>
                  Day {activeChallenge.current_day} of {activeChallenge.challenge.duration_days}
                </div>
              </div>
              <span style={s.flameIcon}>🔥</span>
            </div>

            <div style={s.promptBox}>
              <div style={s.promptText}>"{activeChallenge.prompt.prompt_text}"</div>
            </div>

            {activeChallenge.prompt.exercise_text && (
              <div style={s.exerciseBox}>
                <div style={s.exerciseText}>{activeChallenge.prompt.exercise_text}</div>
              </div>
            )}

            <button style={s.primaryBtn} onClick={openComposeForChallenge}>
              ✏️ Write Reflection
            </button>
          </div>
        )}

        {/* Compose Modal */}
        {showCompose && (
          <div style={s.modalOverlay} onClick={() => setShowCompose(false)}>
            <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={s.modalHeader}>
                <h3 style={s.modalTitle}>
                  {composingFromChallenge ? 'Challenge Reflection' : composingFromPrompt ? 'Guided Reflection' : 'Free Reflection'}
                </h3>
                <button
                  style={s.closeBtn}
                  onClick={() => setShowCompose(false)}
                >
                  ✕
                </button>
              </div>

              {composingFromPrompt && !composingFromChallenge && (
                <div style={s.promptPreview}>
                  <div style={s.promptPreviewText}>"{composingFromPrompt}"</div>
                </div>
              )}

              <textarea
                style={s.textarea}
                placeholder="Take your time. This is just for you."
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                rows={6}
              />

              <div style={s.tagSection}>
                <div style={s.tagLabel}>How does this reflection relate to you?</div>
                <div style={s.tagChips}>
                  {TAG_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      style={{
                        ...s.tagChip,
                        backgroundColor: selectedTags.includes(tag) ? 'var(--accent)' : 'var(--bg)',
                        color: selectedTags.includes(tag) ? '#fff' : 'var(--ink)',
                      }}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.composeActions}>
                <button style={s.secondaryBtn} onClick={() => setShowCompose(false)}>
                  Cancel
                </button>
                <button
                  style={{
                    ...s.primaryBtn,
                    opacity: !composeText.trim() || isSubmitting ? 0.5 : 1,
                  }}
                  onClick={handleSaveReflection}
                  disabled={!composeText.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Reflection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Prompts */}
        {!activeChallenge && !showCompose && (
          <div style={s.promptsSection}>
            <h3 style={s.sectionHeading}>Quick Prompts</h3>
            {randomPrompts.map((prompt, idx) => (
              <button
                key={idx}
                style={s.quickPromptCard}
                onClick={() => openComposeForPrompt(prompt)}
              >
                <div style={s.quickPromptText}>"{prompt}"</div>
                <span style={s.promptArrow}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* Reflections Feed */}
        <div style={s.reflectionsSection}>
          <h3 style={s.sectionHeading}>Your Reflections</h3>

          {reflections.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>✏️</div>
              <h3 style={s.emptyTitle}>Begin your reflection practice</h3>
              <p style={s.emptySubtext}>
                Private reflections help you process, grow, and prepare for what's next.
              </p>
              <div style={s.emptyActionButtons}>
                <button style={s.emptyActionBtn} onClick={openFreeWrite}>
                  Start with a prompt
                </button>
                <button style={s.emptyActionBtn} onClick={openComposeForChallenge}>
                  Begin a challenge
                </button>
              </div>
            </div>
          ) : (
            <div>
              {reflections.map(reflection => (
                <div key={reflection.id} style={s.reflectionCard}>
                  <div style={s.reflectionHeader}>
                    <div style={s.reflectionDate}>📅 {formatDate(reflection.created_at)}</div>
                  </div>

                  {reflection.prompt && (
                    <div style={s.reflectionPrompt}>"{reflection.prompt}"</div>
                  )}

                  {!reflection.prompt && (
                    <div style={s.reflectionLabel}>Free reflection</div>
                  )}

                  <div style={s.reflectionText}>{reflection.response}</div>

                  {reflection.tags && reflection.tags.length > 0 && (
                    <div style={s.reflectionTags}>
                      {reflection.tags.map(tag => (
                        <button
                          key={tag}
                          style={s.tagPill}
                          onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={s.reflectionActionButtons}>
                    <button
                      style={s.reflectionActionBtn}
                      onClick={() => navigate('/guide')}
                    >
                      Ask Guide about this
                    </button>
                    <button
                      style={s.reflectionActionBtn}
                      onClick={() => navigate('/toolkit')}
                    >
                      Explore in Toolkit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Strip */}
        <div style={s.statsStrip}>
          <div style={s.statsContent}>
            <div style={s.statText}>
              {stats.total} {stats.total === 1 ? 'reflection' : 'reflections'}
            </div>
            <div style={s.statSeparator}>·</div>
            <div style={s.statText}>
              {formatStreak(stats.streak)}
            </div>
            <div style={s.statSeparator}>·</div>
            <div style={s.statText}>
              {stats.completed} {stats.completed === 1 ? 'challenge' : 'challenges'} completed
            </div>
          </div>
          {stats.completed === 0 && (
            <button style={s.statHint} onClick={openComposeForChallenge}>
              Start your first challenge →
            </button>
          )}
          {stats.total > 3 && (
            <button style={s.statHint} onClick={() => navigate('/toolkit')}>
              See patterns emerging →
            </button>
          )}
        </div>

      </div>

      {/* Floating Action Button */}
      {!showCompose && (
        <button style={s.fab} onClick={openFreeWrite}>
          +
        </button>
      )}
    </div>
  );
}

const s = {
  centerPage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    background: 'var(--bg)',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--bg)',
    overflow: 'hidden',
  },
  scrollContent: {
    flex: 1,
    overflow: 'auto',
    paddingBottom: '0',
  },

  // Header
  headerSection: {
    padding: '24px 20px',
    borderBottomLeftRadius: '28px',
    borderBottomRightRadius: '28px',
    background: 'var(--bg2)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.3px',
    margin: '0 0 8px 0',
    color: 'var(--ink)',
  },
  headerSubtext: {
    fontSize: '14px',
    marginTop: '4px',
    lineHeight: '20px',
    color: 'var(--text2)',
    margin: 0,
  },

  // Challenge Card
  challengeCard: {
    margin: '24px 20px 0',
    padding: '16px',
    borderRadius: '16px',
    border: '1.5px solid var(--accent)',
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
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--ink)',
    margin: 0,
  },
  challengeMeta: {
    fontSize: '12px',
    marginTop: '4px',
    color: 'var(--text2)',
  },
  flameIcon: {
    fontSize: '20px',
  },
  promptBox: {
    marginBottom: '12px',
  },
  promptText: {
    fontSize: '15px',
    fontStyle: 'italic',
    lineHeight: '22px',
    color: 'var(--ink)',
  },
  exerciseBox: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--accent)',
    background: 'rgba(var(--accent-rgb), 0.08)',
    marginBottom: '12px',
  },
  exerciseText: {
    fontSize: '13px',
    lineHeight: '20px',
    color: 'var(--ink)',
  },

  // Quick Prompts
  promptsSection: {
    margin: '24px 20px 0',
  },
  sectionHeading: {
    fontSize: '14px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    color: 'var(--ink)',
  },
  quickPromptCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '8px',
    border: '1px solid var(--text3)',
    background: 'var(--bg2)',
    cursor: 'pointer',
  },
  quickPromptText: {
    fontSize: '13px',
    lineHeight: '19px',
    flex: 1,
    marginRight: '12px',
    color: 'var(--text2)',
  },
  promptArrow: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--accent)',
  },

  // Reflections Section
  reflectionsSection: {
    margin: '24px 20px 0',
  },
  reflectionCard: {
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '8px',
    border: '1px solid var(--text3)',
    background: 'var(--bg2)',
  },
  reflectionHeader: {
    marginBottom: '8px',
  },
  reflectionDate: {
    fontSize: '12px',
    color: 'var(--text2)',
  },
  reflectionPrompt: {
    fontSize: '12px',
    fontStyle: 'italic',
    marginBottom: '8px',
    color: 'var(--text2)',
  },
  reflectionLabel: {
    fontSize: '12px',
    marginBottom: '8px',
    color: 'var(--text2)',
  },
  reflectionText: {
    fontSize: '14px',
    lineHeight: '21px',
    marginBottom: '8px',
    color: 'var(--ink)',
  },
  reflectionTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '8px',
  },
  tagPill: {
    padding: '4px 10px',
    borderRadius: '9999px',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    fontSize: '11px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
  },
  reflectionActionButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px',
  },
  reflectionActionBtn: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--text3)',
    background: 'var(--bg)',
    color: 'var(--accent)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '32px 20px',
    borderRadius: '12px',
    marginBottom: '24px',
    background: 'var(--bg2)',
  },
  emptyIcon: {
    fontSize: '40px',
    marginBottom: '12px',
    display: 'block',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    color: 'var(--ink)',
  },
  emptySubtext: {
    fontSize: '13px',
    textAlign: 'center',
    lineHeight: '20px',
    color: 'var(--text2)',
    margin: 0,
  },
  emptyActionButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    flexDirection: 'column',
  },
  emptyActionBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // Compose Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90vh',
    background: 'var(--bg)',
    borderTopLeftRadius: '28px',
    borderTopRightRadius: '28px',
    padding: '24px 20px 20px',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--ink)',
    margin: 0,
  },
  closeBtn: {
    fontSize: '24px',
    background: 'none',
    border: 'none',
    color: 'var(--text2)',
    cursor: 'pointer',
    padding: 0,
  },
  promptPreview: {
    padding: '12px',
    borderRadius: '8px',
    background: 'var(--bg2)',
    marginBottom: '12px',
  },
  promptPreviewText: {
    fontSize: '13px',
    fontStyle: 'italic',
    lineHeight: '20px',
    color: 'var(--text2)',
    margin: 0,
  },
  textarea: {
    width: '100%',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px',
    minHeight: '150px',
    fontSize: '14px',
    lineHeight: '21px',
    marginBottom: '24px',
    background: 'var(--bg2)',
    color: 'var(--ink)',
    fontFamily: 'inherit',
    resize: 'vertical',
  },

  // Tag Section
  tagSection: {
    marginBottom: '24px',
  },
  tagLabel: {
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
    color: 'var(--ink)',
  },
  tagChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tagChip: {
    padding: '7px 14px',
    borderRadius: '9999px',
    border: '1px solid var(--border)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // Buttons
  primaryBtn: {
    width: '100%',
    padding: '14px 0',
    borderRadius: '8px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    alignItems: 'center',
    textAlign: 'center',
  },
  secondaryBtn: {
    padding: '12px 0',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text2)',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    flex: 1,
    textAlign: 'center',
  },
  composeActions: {
    display: 'flex',
    gap: '12px',
  },

  // Stats Strip
  statsStrip: {
    display: 'flex',
    flexDirection: 'column',
    margin: '24px 20px 0',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    background: 'var(--bg2)',
    gap: '8px',
  },
  statsContent: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
  },
  statText: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--ink)',
  },
  statSeparator: {
    fontSize: '12px',
    color: 'var(--text2)',
  },
  statHint: {
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    cursor: 'pointer',
    padding: 0,
  },

  // FAB
  fab: {
    position: 'fixed',
    bottom: '84px',
    right: '20px',
    width: '56px',
    height: '56px',
    borderRadius: '28px',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '28px',
    fontWeight: '300',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
