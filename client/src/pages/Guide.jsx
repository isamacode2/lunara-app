import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader } from 'lucide-react';

export default function Guide() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [guidanceThread, setGuidanceThread] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentReflection, setRecentReflection] = useState(null);
  const threadEndRef = useRef(null);

  const PRIMARY_MODULES = [
    {
      id: 'situation',
      icon: '💬',
      title: 'Talk through a situation',
      description: 'Unpack what\'s happening with clarity and structure',
      premium: false,
    },
    {
      id: 'conversation',
      icon: '🤝',
      title: 'Prepare a conversation',
      description: 'Get ready to say what needs to be said',
      premium: false,
    },
    {
      id: 'boundary',
      icon: '🛡️',
      title: 'Draft a boundary',
      description: 'Find the words to hold your line with care',
      premium: true,
    },
    {
      id: 'jealousy',
      icon: '💔',
      title: 'Make sense of jealousy',
      description: 'Separate fear from fact, insecurity from need',
      premium: false,
    },
    {
      id: 'agreement',
      icon: '✋',
      title: 'Clarify an agreement',
      description: 'Define or revisit relationship structures',
      premium: true,
    },
    {
      id: 'focus',
      icon: '🧭',
      title: 'Choose my next focus',
      description: 'Find what to work on based on where you are',
      premium: false,
    },
  ];

  const MODULE_PROMPTS = {
    situation: [
      'My partner wants more freedom than I\'m comfortable with',
      'I\'m not sure whether this is insecurity or a real issue',
      'I\'m overwhelmed and need to sort my thoughts first',
      'Something happened and I don\'t know how I feel about it',
    ],
    conversation: [
      'I need to bring up a boundary without sounding controlling',
      'I want to explain ENM to someone clearly',
      'I need to tell a partner something is bothering me',
      'I want to ask for something I\'ve been avoiding',
    ],
    boundary: [
      'I need to set a boundary around time and availability',
      'I want to say no to something without guilt',
      'I need to restate a boundary that keeps getting crossed',
      'I\'m not sure if this is a boundary or a rule',
    ],
    jealousy: [
      'I feel jealous but I don\'t know what it means',
      'My partner is seeing someone new and I\'m struggling',
      'I know this is irrational but I can\'t stop the feeling',
      'I want to feel compersion but I\'m not there yet',
    ],
    agreement: [
      'I need help defining an agreement with a new partner',
      'Our current agreement isn\'t working anymore',
      'I want to revisit our boundaries after a change',
      'I\'m not sure what kind of structure fits us',
    ],
    focus: [
      'I\'m new to ENM and don\'t know where to begin',
      'I\'ve been stuck and need direction',
      'I want to grow but I\'m not sure what area to focus on',
      'I completed a challenge and want to keep going',
    ],
  };

  const GUIDANCE_STRUCTURES = {
    situation: {
      sections: [
        {
          heading: 'What seems most important here',
          body: 'Based on what you\'ve shared, there\'s a tension between what you need and what\'s being asked of you. This is common in ENM when relationship dynamics shift.',
        },
        {
          heading: 'What may be assumption vs fact',
          body: 'Consider separating the facts of the situation from the story you\'re telling yourself about it. What do you know for certain? What are you interpreting?',
        },
        {
          heading: 'What needs clarity first',
          body: 'Under most ENM conflict sits a need — for safety, reassurance, autonomy, or recognition. Try to name what you need most right now.',
        },
        {
          heading: 'A calm way to think about this',
          body: 'If this situation were happening to someone you care about, what would you tell them to pay attention to?',
        },
        {
          heading: 'One suggested next step',
          body: 'Write a short reflection about what feels most urgent. Then consider whether this is a conversation to have, a boundary to set, or a feeling to process first.',
        },
      ],
    },
    conversation: {
      sections: [
        {
          heading: 'What you seem to want to communicate',
          body: 'The core of what you need to express is a clear statement of how you feel, what you need, and what you\'re asking for — without blame or demand.',
        },
        {
          heading: 'What they may be feeling',
          body: '"I\'ve been thinking about something and I\'d like to talk it through with you. It\'s important to me that we\'re both comfortable, so I wanted to bring it up intentionally."',
        },
        {
          heading: 'A calm opener you could use',
          body: '"I noticed something has been on my mind and I\'d love to explore it together when you have space for it."',
        },
        {
          heading: 'Key points to cover',
          body: 'Avoid absolutes ("you always", "you never"), accusations, or framing it as a problem with them. Focus on your experience, not their behaviour.',
        },
        {
          heading: 'What to do if it doesn\'t go as planned',
          body: 'If the conversation gets intense, it\'s okay to pause and say: "I want to keep talking about this, but I need a moment to collect my thoughts."',
        },
      ],
    },
    boundary: {
      sections: [
        {
          heading: 'The boundary you\'re describing',
          body: 'A boundary protects something important — your time, energy, emotional safety, or a core need. Name what this boundary is in service of.',
        },
        {
          heading: 'Why this boundary matters',
          body: '"I need [specific thing] in order to feel [safe/respected/grounded]. This is important to me and I\'m asking that we honour it."',
        },
        {
          heading: 'A possible way to word it',
          body: '"I care about our connection and I also need to take care of myself here. Can we find a way that works for both of us?"',
        },
        {
          heading: 'How to hold it with care',
          body: '"This is a boundary I\'m not willing to negotiate on right now. I need it to be respected for me to feel safe continuing."',
        },
        {
          heading: 'What to do if it\'s challenged',
          body: 'If a boundary is repeatedly crossed after being clearly stated, that\'s information about the dynamic — not about whether your boundary is valid.',
        },
      ],
    },
    jealousy: {
      sections: [
        {
          heading: 'What\'s coming up for you',
          body: 'Jealousy is rarely about the surface event. It usually points to a fear — of being replaced, not being enough, or losing something important. What\'s the fear underneath?',
        },
        {
          heading: 'What may be fear vs what\'s actually happening',
          body: 'Separate what actually happened from the story your mind is building. Write down only the facts. Then write down the interpretation. Notice the gap.',
        },
        {
          heading: 'What needs attention underneath',
          body: 'Ask yourself: "Is this a feeling I need to process, or is there something I genuinely need to change about our agreements?" Both are valid — they just require different responses.',
        },
        {
          heading: 'A grounding thought',
          body: 'Your worth in a relationship is not determined by comparison. Jealousy doesn\'t make you a bad partner — it makes you human.',
        },
        {
          heading: 'One thing to try this week',
          body: 'What would you need to hear from your partner right now to feel more secure? Is that something you can ask for?',
        },
      ],
    },
    agreement: {
      sections: [
        {
          heading: 'What the agreement covers',
          body: 'Good ENM agreements address: communication expectations, time allocation, sexual health, disclosure preferences, and what happens when things change.',
        },
        {
          heading: 'What each person needs',
          body: 'Consider: What are our non-negotiables? What\'s flexible? How do we handle new connections? What does check-in look like? What happens if someone feels unsafe?',
        },
        {
          heading: 'Potential gaps or assumptions',
          body: 'Start with shared values → define boundaries → agree on communication rhythm → plan for when things change → set a review date.',
        },
        {
          heading: 'A clearer version to consider',
          body: '"I\'d like us to agree on..." rather than "You need to..." Frame agreements as mutual, living documents — not rules imposed by one person.',
        },
        {
          heading: 'How to revisit this together',
          body: 'Schedule regular agreement reviews (monthly or quarterly). Use the RADAR check-in framework. Agreements should evolve as your relationship does.',
        },
      ],
    },
    focus: {
      sections: [
        {
          heading: 'Where you seem to be right now',
          body: 'Based on your recent activity, you\'re in an active growth phase. The best thing you can do is focus on one area at a time rather than trying to work on everything.',
        },
        {
          heading: 'What matters most at this stage',
          body: 'Consider what feels most pressing: Is it a communication skill? A boundary issue? An emotional pattern? A relationship structure question? Start there.',
        },
        {
          heading: 'One area to focus on first',
          body: 'If you\'re early in your ENM journey, start with the foundations guides. If you\'re navigating a specific situation, jump to the communication or boundaries section.',
        },
        {
          heading: 'A resource that might help',
          body: 'Write down: "The thing I most want to get better at in my relationships is..." — then use that as your compass for the next two weeks.',
        },
        {
          heading: 'A small step to take today',
          body: 'Join a circle that matches your current focus. The conversations there will reinforce what you\'re learning and help you feel less alone in the process.',
        },
      ],
    },
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  async function loadData() {
    if (!user?.id) return;
    try {
      // Check premium status
      const { data: profileData } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (profileData?.subscription_tier === 'premium') {
        setIsPremium(true);
      }

      // Fetch recent reflection
      const { data: reflData } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (reflData) {
        setRecentReflection(reflData);
      }
    } catch (err) {
      console.log('Data load error:', err);
    }
  }

  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView?.({ behavior: 'smooth' });
    }
  }, [guidanceThread, isProcessing]);

  function handleModuleSelect(mod) {
    setActiveModule(mod);
    setGuidanceThread([]);
    setInputText('');
  }

  function handlePromptSelect(prompt) {
    setInputText(prompt);
  }

  function generateGuidanceResponse(moduleId) {
    return GUIDANCE_STRUCTURES[moduleId] || GUIDANCE_STRUCTURES.situation;
  }

  async function handleSubmit() {
    if (!inputText.trim() || isProcessing) return;

    if (!isPremium) {
      setShowSubModal(true);
      return;
    }

    const userMessage = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    setGuidanceThread(prev => [...prev, { role: 'user', content: userMessage }]);

    setTimeout(() => {
      const response = generateGuidanceResponse(activeModule?.id);
      setGuidanceThread(prev => [...prev, { role: 'guide', content: response }]);
      setIsProcessing(false);
    }, 1800);
  }

  // Module view
  if (activeModule) {
    const prompts = MODULE_PROMPTS[activeModule.id] || [];

    return (
      <div style={s.container}>
        {/* Header */}
        <div style={s.moduleHeader}>
          <button style={s.backButton} onClick={() => setActiveModule(null)}>
            ← Guide
          </button>
          <div style={s.moduleTitleRow}>
            <span style={s.moduleIcon}>{activeModule.icon}</span>
            <h1 style={s.moduleTitle}>{activeModule.title}</h1>
          </div>
          <p style={s.moduleDesc}>{activeModule.description}</p>
        </div>

        {/* Thread scroll area */}
        <div style={s.threadScroll}>
          {guidanceThread.length === 0 && (
            <div style={s.starterContainer}>
              <div style={s.starterLabel}>Start with a situation or pick one below</div>
              <div style={s.promptChips}>
                {prompts.map((prompt, i) => (
                  <button
                    key={i}
                    style={s.promptChip}
                    onClick={() => handlePromptSelect(prompt)}
                  >
                    <div style={s.promptChipText}>{prompt}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {guidanceThread.map((msg, idx) => (
            <div
              key={idx}
              style={msg.role === 'user' ? s.userMessageContainer : s.messageContainer}
            >
              {msg.role === 'user' ? (
                <div style={s.userMessage}>
                  <div style={s.userMessageText}>{msg.content}</div>
                </div>
              ) : (
                <>
                  <div style={s.guideResponseContainer}>
                    {msg.content.sections.map((section, si) => (
                      <div key={si} style={s.responseSection}>
                        <div style={s.sectionHeading}>{section.heading}</div>
                        <div style={s.sectionBody}>{section.body}</div>
                      </div>
                    ))}
                  </div>
                  <div style={s.actionButtonsContainer}>
                    <button style={s.actionButton}>Save this guidance</button>
                    <button
                      style={s.actionButton}
                      onClick={() => navigate('/toolkit')}
                    >
                      Explore in Toolkit
                    </button>
                    <button
                      style={s.actionButton}
                      onClick={() => navigate('/circles')}
                    >
                      Find a Circle
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {isProcessing && (
            <div style={s.processingContainer}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <div style={s.processingText}>Thinking through this...</div>
            </div>
          )}

          <div ref={threadEndRef} />
        </div>

        {/* Input area */}
        <div style={s.inputArea}>
          <div style={s.inputRow}>
            <textarea
              style={s.input}
              placeholder="Describe your situation..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing}
            />
            <button
              style={{
                ...s.sendButton,
                backgroundColor: inputText.trim() ? 'var(--accent)' : 'var(--text3)',
              }}
              onClick={handleSubmit}
              disabled={!inputText.trim() || isProcessing}
            >
              →
            </button>
          </div>
          <div style={s.inputNote}>
            Your guidance is private and not shared with other members
          </div>
        </div>
      </div>
    );
  }

  // Hub view
  return (
    <div style={s.container}>
      <div style={s.scrollContent}>
        {/* Hero */}
        <div style={s.hero}>
          <div style={s.heroBadge}>✨ ENM Guidance</div>
          <h1 style={s.heroTitle}>Practical help for real-life ENM situations</h1>
          <p style={s.heroDesc}>
            Structured support for conversations, boundaries, jealousy, and the moments that matter most.
          </p>
        </div>

        {/* Primary Modules */}
        <div style={s.section}>
          <div style={s.sectionLabel}>WHAT DO YOU NEED?</div>
          <div style={s.modulesGrid}>
            {PRIMARY_MODULES.map((mod) => (
              <button
                key={mod.id}
                style={s.moduleCard}
                onClick={() => handleModuleSelect(mod)}
              >
                <div style={s.moduleCardIcon}>{mod.icon}</div>
                <div style={s.moduleCardTitle}>
                  {mod.title}
                  {mod.premium && <span style={s.premiumTag}> Premium</span>}
                </div>
                <div style={s.moduleCardDesc}>{mod.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Journey Section */}
        <div style={s.section}>
          <div style={s.sectionLabel}>YOUR JOURNEY</div>

          {recentReflection && (
            <div style={s.suggestionCard}>
              <div style={s.suggestionLabel}>Based on your recent reflection</div>
              <div style={s.suggestionText}>
                {recentReflection.tags?.includes('jealousy')
                  ? 'You reflected on jealousy recently. Want to explore it deeper?'
                  : recentReflection.tags?.includes('boundaries')
                  ? 'You\'ve been thinking about boundaries. Ready to draft one?'
                  : recentReflection.tags?.includes('communication')
                  ? 'Your recent reflection touched on communication. Want to prepare a conversation?'
                  : 'Continue working through what came up in your last reflection.'}
              </div>
            </div>
          )}

          {/* Quick Path Pills */}
          <div style={s.quickPathsContainer}>
            <button
              style={s.quickPath}
              onClick={() => navigate('/toolkit')}
            >
              <div style={s.quickPathIcon}>📚</div>
              <div style={s.quickPathText}>Explore Toolkit</div>
            </button>
            <button
              style={s.quickPath}
              onClick={() => navigate('/circles')}
            >
              <div style={s.quickPathIcon}>👥</div>
              <div style={s.quickPathText}>Join a Circle</div>
            </button>
            <button
              style={s.quickPath}
              onClick={() => navigate('/reflect')}
            >
              <div style={s.quickPathIcon}>✍️</div>
              <div style={s.quickPathText}>Start Reflecting</div>
            </button>
          </div>
        </div>

        {/* Free-form Entry */}
        <div style={s.section}>
          <div style={s.sectionLabel}>DESCRIBE YOUR SITUATION</div>
          <div style={s.freeformBox}>
            <textarea
              style={s.freeformInput}
              placeholder="What's happening? I'll help you think it through clearly..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={3}
            />
            <button
              style={{
                ...s.freeformBtn,
                backgroundColor: inputText.trim() ? 'var(--accent)' : 'var(--text3)',
              }}
              onClick={() => {
                if (!inputText.trim()) return;
                if (!isPremium) {
                  setShowSubModal(true);
                  return;
                }
                const text = inputText.trim();
                setActiveModule(PRIMARY_MODULES[0]);
                setGuidanceThread([]);
                setInputText('');
                setIsProcessing(true);
                setGuidanceThread([{ role: 'user', content: text }]);
                setTimeout(() => {
                  const response = generateGuidanceResponse('situation');
                  setGuidanceThread(prev => [...prev, { role: 'guide', content: response }]);
                  setIsProcessing(false);
                }, 1800);
              }}
              disabled={!inputText.trim()}
            >
              ✨ Get guidance
            </button>
          </div>
        </div>

        <div style={{ height: '8px' }} />
      </div>

      {/* Subscription Modal */}
      {showSubModal && (
        <div style={s.modalOverlay} onClick={() => setShowSubModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <button
              style={s.modalClose}
              onClick={() => setShowSubModal(false)}
            >
              ✕
            </button>

            <div style={s.modalIcon}>✨</div>
            <h2 style={s.modalTitle}>Unlock ENM Guidance</h2>
            <p style={s.modalDesc}>
              Get structured AI-powered support for conversations, boundaries, jealousy, agreements, and more.
            </p>

            <div style={s.modalFreeNote}>
              All members get Talk through a situation, Prepare a conversation, and Make sense of jealousy for free.
            </div>

            <div style={s.modalFeatures}>
              <div style={s.modalFeature}>• Personalised situation analysis</div>
              <div style={s.modalFeature}>• Conversation drafts and openers</div>
              <div style={s.modalFeature}>• Boundary wording builder</div>
              <div style={s.modalFeature}>• Multi-step guidance threads</div>
              <div style={s.modalFeature}>• Reflection-to-action recommendations</div>
              <div style={s.modalFeature}>• Tailored toolkit and circle suggestions</div>
            </div>

            <button
              style={s.modalButton}
              onClick={() => setShowSubModal(false)}
            >
              Unlock Full Guidance — $9.99/month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
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
    padding: '24px 12px 20px',
  },

  // Hero
  hero: {
    marginBottom: '32px',
    padding: '0 8px',
  },
  heroBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '9999px',
    backgroundColor: 'var(--bg2)',
    marginBottom: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: '36px',
    margin: '0 0 12px 0',
    color: 'var(--ink)',
  },
  heroDesc: {
    fontSize: '16px',
    lineHeight: '24px',
    color: 'var(--text2)',
    margin: 0,
  },

  // Sections
  section: {
    marginBottom: '32px',
    padding: '0 8px',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1px',
    color: 'var(--text3)',
    marginBottom: '12px',
  },

  // Module Cards
  modulesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  moduleCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    borderRadius: '12px',
    background: 'var(--bg2)',
    border: '1px solid var(--text3)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  moduleCardIcon: {
    fontSize: '24px',
    marginBottom: '8px',
    lineHeight: 1,
  },
  moduleCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--ink)',
    marginBottom: '4px',
  },
  premiumTag: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--accent)',
  },
  moduleCardDesc: {
    fontSize: '14px',
    lineHeight: '20px',
    color: 'var(--text2)',
  },

  // Journey Section
  suggestionCard: {
    padding: '12px',
    borderRadius: '12px',
    background: 'var(--bg2)',
    border: '1px solid var(--text3)',
    marginBottom: '12px',
  },
  suggestionLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text3)',
    marginBottom: '6px',
  },
  suggestionText: {
    fontSize: '14px',
    lineHeight: '20px',
    color: 'var(--ink)',
  },

  // Quick Paths
  quickPathsContainer: {
    display: 'flex',
    gap: '12px',
  },
  quickPath: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '12px',
    background: 'var(--bg2)',
    border: '1px solid var(--text3)',
    cursor: 'pointer',
    textAlign: 'center',
  },
  quickPathIcon: {
    fontSize: '20px',
    marginBottom: '6px',
    lineHeight: 1,
  },
  quickPathText: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--ink)',
  },

  // Free-form Entry
  freeformBox: {
    borderRadius: '12px',
    background: 'var(--bg2)',
    padding: '12px',
    border: '1px solid var(--text3)',
  },
  freeformInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid var(--text3)',
    background: 'var(--bg)',
    color: 'var(--ink)',
    fontSize: '14px',
    fontFamily: 'inherit',
    marginBottom: '10px',
    resize: 'vertical',
  },
  freeformBtn: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    color: '#fff',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxWidth: '400px',
    background: 'var(--bg2)',
    borderRadius: '12px',
    padding: '20px',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: '8px',
    right: '12px',
    width: '32px',
    height: '32px',
    border: 'none',
    background: 'var(--bg)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    color: 'var(--text2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIcon: {
    fontSize: '40px',
    textAlign: 'center',
    marginBottom: '12px',
    display: 'block',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--ink)',
    margin: '0 0 12px 0',
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: '14px',
    color: 'var(--text2)',
    margin: '0 0 12px 0',
    lineHeight: '20px',
    textAlign: 'center',
  },
  modalFreeNote: {
    fontSize: '13px',
    color: 'var(--text2)',
    margin: '0 0 12px 0',
    padding: '12px',
    borderRadius: '8px',
    background: 'var(--bg)',
    lineHeight: '20px',
    textAlign: 'center',
  },
  modalFeatures: {
    margin: '12px 0',
  },
  modalFeature: {
    fontSize: '13px',
    color: 'var(--ink)',
    margin: '8px 0',
    lineHeight: '18px',
  },
  modalButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px',
  },

  // Module View
  moduleHeader: {
    borderBottom: '1px solid var(--border)',
    padding: '12px 12px 16px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: 'var(--ink)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '12px',
    padding: 0,
  },
  moduleTitleRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
    gap: '12px',
  },
  moduleIcon: {
    fontSize: '24px',
    lineHeight: 1,
  },
  moduleTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--ink)',
    margin: 0,
  },
  moduleDesc: {
    fontSize: '14px',
    lineHeight: '20px',
    color: 'var(--text2)',
  },

  // Thread
  threadScroll: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 12px 0',
  },
  starterContainer: {
    marginBottom: '16px',
  },
  starterLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text2)',
    marginBottom: '12px',
  },
  promptChips: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  promptChip: {
    padding: '12px',
    borderRadius: '8px',
    background: 'var(--bg2)',
    border: '1px solid var(--text3)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--ink)',
    textAlign: 'left',
  },
  promptChipText: {
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '20px',
    color: 'var(--ink)',
  },

  messageContainer: {
    marginBottom: '16px',
  },
  userMessageContainer: {
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  userMessage: {
    maxWidth: '80%',
    padding: '8px 12px',
    borderRadius: '12px',
    background: 'var(--accent)',
  },
  userMessageText: {
    color: '#fff',
    fontSize: '14px',
    lineHeight: '20px',
  },

  guideResponseContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  responseSection: {
    marginBottom: '12px',
  },
  sectionHeading: {
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '6px',
    color: 'var(--accent)',
  },
  sectionBody: {
    fontSize: '14px',
    lineHeight: '20px',
    color: 'var(--ink)',
  },

  processingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
  },
  processingText: {
    fontSize: '14px',
    color: 'var(--text2)',
  },

  actionButtonsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  actionButton: {
    padding: '6px 12px',
    borderRadius: '16px',
    border: '1px solid var(--accent)',
    background: 'rgba(var(--accent-rgb), 0.08)',
    color: 'var(--accent)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },

  // Input Area
  inputArea: {
    borderTop: '1px solid var(--border)',
    padding: '12px',
    background: 'var(--bg2)',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '8px 10px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid var(--text3)',
    background: 'var(--bg)',
    color: 'var(--ink)',
    fontFamily: 'inherit',
    resize: 'none',
    maxHeight: '100px',
  },
  sendButton: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    color: '#fff',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer',
  },
  inputNote: {
    fontSize: '12px',
    textAlign: 'center',
    color: 'var(--text2)',
    marginTop: '6px',
  },
};
