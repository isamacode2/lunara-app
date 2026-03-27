import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader } from 'lucide-react';

const PRIMARY_MODULES = [
  { id: 'situation', title: 'Talk through a situation', description: 'Unpack what\'s happening with clarity and structure' },
  { id: 'conversation', title: 'Prepare a conversation', description: 'Get ready to say what needs to be said' },
  { id: 'boundary', title: 'Draft a boundary', description: 'Find the words to hold your line with care' },
  { id: 'jealousy', title: 'Make sense of jealousy', description: 'Separate fear from fact, insecurity from need' },
  { id: 'agreement', title: 'Clarify an agreement', description: 'Define or revisit relationship structures' },
  { id: 'focus', title: 'Choose my next focus', description: 'Find what to work on based on where you are' },
];

const MODULE_PROMPTS = {
  situation: ['My partner wants more freedom than I\'m comfortable with', 'I\'m not sure whether this is insecurity or a real issue', 'I\'m overwhelmed and need to sort my thoughts first', 'Something happened and I don\'t know how I feel about it'],
  conversation: ['I need to bring up a boundary without sounding controlling', 'I want to explain ENM to someone clearly', 'I need to tell a partner something is bothering me', 'I want to ask for something I\'ve been avoiding'],
  boundary: ['I need to set a boundary around time and availability', 'I want to say no to something without guilt', 'I need to restate a boundary that keeps getting crossed', 'I\'m not sure if this is a boundary or a rule'],
  jealousy: ['I feel jealous but I don\'t know what it means', 'My partner is seeing someone new and I\'m struggling', 'I know this is irrational but I can\'t stop the feeling', 'I want to feel compersion but I\'m not there yet'],
  agreement: ['I need help defining an agreement with a new partner', 'Our current agreement isn\'t working anymore', 'I want to revisit our boundaries after a change', 'I\'m not sure what kind of structure fits us'],
  focus: ['I\'m new to ENM and don\'t know where to begin', 'I\'ve been stuck and need direction', 'I want to grow but I\'m not sure what area to focus on', 'I completed a challenge and want to keep going'],
};

const GUIDANCE = {
  situation: { sections: [
    { heading: 'What seems most important here', body: 'Based on what you\'ve shared, there\'s a tension between what you need and what\'s being asked of you. This is common in ENM when relationship dynamics shift.' },
    { heading: 'What may be assumption vs fact', body: 'Consider separating the facts of the situation from the story you\'re telling yourself about it. What do you know for certain? What are you interpreting?' },
    { heading: 'What needs clarity first', body: 'Under most ENM conflict sits a need — for safety, reassurance, autonomy, or recognition. Try to name what you need most right now.' },
    { heading: 'A calm way to think about this', body: 'If this situation were happening to someone you care about, what would you tell them to pay attention to?' },
    { heading: 'One suggested next step', body: 'Write a short reflection about what feels most urgent. Then consider whether this is a conversation to have, a boundary to set, or a feeling to process first.' },
  ]},
  conversation: { sections: [
    { heading: 'What you seem to want to communicate', body: 'The core of what you need to express is a clear statement of how you feel, what you need, and what you\'re asking for — without blame or demand.' },
    { heading: 'What they may be feeling', body: 'Consider that your partner may also be navigating uncertainty. Approaching with curiosity rather than certainty creates space for both of you.' },
    { heading: 'A calm opener you could use', body: '"I\'ve been thinking about something and I\'d love to explore it together when you have space for it." This signals intention without pressure.' },
    { heading: 'Key points to cover', body: 'Avoid absolutes ("you always", "you never"), accusations, or framing it as a problem with them. Focus on your experience, not their behaviour.' },
    { heading: 'What to do if it doesn\'t go as planned', body: 'If the conversation gets intense, it\'s okay to pause and say: "I want to keep talking about this, but I need a moment to collect my thoughts."' },
  ]},
  boundary: { sections: [
    { heading: 'The boundary you\'re describing', body: 'A boundary protects something important — your time, energy, emotional safety, or a core need. Name what this boundary is in service of.' },
    { heading: 'Why this boundary matters', body: 'Boundaries aren\'t walls. They\'re agreements you make with yourself about what you need to feel safe and respected in your relationships.' },
    { heading: 'A possible way to word it', body: '"I care about our connection and I also need to take care of myself here. Can we find a way that works for both of us?"' },
    { heading: 'How to hold it with care', body: '"This is a boundary I\'m not willing to negotiate on right now. I need it to be respected for me to feel safe continuing."' },
    { heading: 'What to do if it\'s challenged', body: 'If a boundary is repeatedly crossed after being clearly stated, that\'s information about the dynamic — not about whether your boundary is valid.' },
  ]},
  jealousy: { sections: [
    { heading: 'What\'s coming up for you', body: 'Jealousy is rarely about the surface event. It usually points to a fear — of being replaced, not being enough, or losing something important. What\'s the fear underneath?' },
    { heading: 'What may be fear vs what\'s actually happening', body: 'Separate what actually happened from the story your mind is building. Write down only the facts. Then write down the interpretation. Notice the gap.' },
    { heading: 'What needs attention underneath', body: 'Ask yourself: "Is this a feeling I need to process, or is there something I genuinely need to change about our agreements?" Both are valid — they just require different responses.' },
    { heading: 'A grounding thought', body: 'Your worth in a relationship is not determined by comparison. Jealousy doesn\'t make you a bad partner — it makes you human.' },
    { heading: 'One thing to try this week', body: 'What would you need to hear from your partner right now to feel more secure? Is that something you can ask for?' },
  ]},
  agreement: { sections: [
    { heading: 'What the agreement covers', body: 'Good ENM agreements address: communication expectations, time allocation, sexual health, disclosure preferences, and what happens when things change.' },
    { heading: 'What each person needs', body: 'Consider: What are our non-negotiables? What\'s flexible? How do we handle new connections? What does check-in look like? What happens if someone feels unsafe?' },
    { heading: 'Potential gaps or assumptions', body: 'Start with shared values, define boundaries, agree on communication rhythm, plan for when things change, and set a review date.' },
    { heading: 'A clearer version to consider', body: '"I\'d like us to agree on..." rather than "You need to..." Frame agreements as mutual, living documents — not rules imposed by one person.' },
    { heading: 'How to revisit this together', body: 'Schedule regular agreement reviews (monthly or quarterly). Use the RADAR check-in framework. Agreements should evolve as your relationship does.' },
  ]},
  focus: { sections: [
    { heading: 'Where you seem to be right now', body: 'Based on your recent activity, you\'re in an active growth phase. The best thing you can do is focus on one area at a time rather than trying to work on everything.' },
    { heading: 'What matters most at this stage', body: 'Consider what feels most pressing: Is it a communication skill? A boundary issue? An emotional pattern? A relationship structure question? Start there.' },
    { heading: 'One area to focus on first', body: 'If you\'re early in your ENM journey, start with the foundations guides. If you\'re navigating a specific situation, jump to the communication or boundaries section.' },
    { heading: 'A resource that might help', body: 'Write down: "The thing I most want to get better at in my relationships is..." — then use that as your compass for the next two weeks.' },
    { heading: 'A small step to take today', body: 'Join a circle that matches your current focus. The conversations there will reinforce what you\'re learning and help you feel less alone in the process.' },
  ]},
};

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

  useEffect(() => { if (user?.id) loadData(); }, [user?.id]);

  async function loadData() {
    try {
      const { data: p } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
      if (p?.subscription_tier === 'premium') setIsPremium(true);
      const { data: r } = await supabase.from('reflections').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
      if (r) setRecentReflection(r);
    } catch (err) { console.log('Data load:', err); }
  }

  useEffect(() => {
    threadEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [guidanceThread, isProcessing]);

  function handleModuleSelect(mod) {
    setActiveModule(mod);
    setGuidanceThread([]);
    setInputText('');
  }

  // Prompt chips always work — free pre-loaded guidance
  function handlePromptSelect(prompt) {
    setInputText('');
    setIsProcessing(true);
    setGuidanceThread([{ role: 'user', content: prompt }]);
    setTimeout(() => {
      setGuidanceThread(prev => [...prev, { role: 'guide', content: GUIDANCE[activeModule?.id] || GUIDANCE.situation }]);
      setIsProcessing(false);
    }, 1200);
  }

  // Custom input requires premium
  function handleSubmit() {
    if (!inputText.trim() || isProcessing) return;
    if (!isPremium) { setShowSubModal(true); return; }
    const msg = inputText.trim();
    setInputText('');
    setIsProcessing(true);
    setGuidanceThread(prev => [...prev, { role: 'user', content: msg }]);
    setTimeout(() => {
      setGuidanceThread(prev => [...prev, { role: 'guide', content: GUIDANCE[activeModule?.id] || GUIDANCE.situation }]);
      setIsProcessing(false);
    }, 1800);
  }

  // ─── PREMIUM MODAL ───
  function renderSubModal() {
    if (!showSubModal) return null;
    const features = ['Describe your situation in your own words', 'Personalised analysis, not templates', 'Conversation scripts tailored to you', 'Boundary language built for your context', 'Unlimited guidance threads'];
    return (
      <div style={s.modalOverlay} onClick={() => setShowSubModal(false)}>
        <div style={s.modal} onClick={e => e.stopPropagation()}>
          <button style={s.modalClose} onClick={() => setShowSubModal(false)}>✕</button>
          <h2 style={s.modalTitle}>Go deeper with Premium</h2>
          <p style={s.modalDesc}>You've seen how the Guide works. With Premium, describe your exact situation and get personalised, structured support.</p>
          <div style={s.modalFeatures}>
            {features.map((f, i) => (
              <div key={i} style={s.modalFeatureRow}>
                <div style={s.featureCheck}>✓</div>
                <div style={s.modalFeature}>{f}</div>
              </div>
            ))}
          </div>
          <button style={s.modalButton} onClick={() => setShowSubModal(false)}>Upgrade to Premium — $9.99/month</button>
          <button style={s.modalDismiss} onClick={() => setShowSubModal(false)}>Not yet</button>
        </div>
      </div>
    );
  }

  // ─── MODULE VIEW ───
  if (activeModule) {
    const prompts = MODULE_PROMPTS[activeModule.id] || [];
    return (
      <div style={s.container}>
        <div style={s.moduleHeader}>
          <button style={s.backButton} onClick={() => setActiveModule(null)}>← Back</button>
          <h1 style={s.moduleTitle}>{activeModule.title}</h1>
          <p style={s.moduleDesc}>{activeModule.description}</p>
        </div>

        <div style={s.threadScroll}>
          {guidanceThread.length === 0 && (
            <div style={s.starterContainer}>
              <div style={s.starterLabel}>Choose a situation to get structured guidance</div>
              <div style={s.promptChips}>
                {prompts.map((prompt, i) => (
                  <button key={i} style={s.promptChip} onClick={() => handlePromptSelect(prompt)}>
                    <span style={s.promptChipText}>{prompt}</span>
                    <span style={s.promptChipArrow}>→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {guidanceThread.map((msg, idx) => (
            <div key={idx} style={msg.role === 'user' ? s.userMessageContainer : s.messageContainer}>
              {msg.role === 'user' ? (
                <div style={s.userMessage}><div style={s.userMessageText}>{msg.content}</div></div>
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
                    <button style={s.actionButton} onClick={() => navigate('/reflect')}>Reflect on this</button>
                  </div>
                  {!isPremium && (
                    <button style={s.upsellCard} onClick={() => setShowSubModal(true)}>
                      <div style={s.upsellTitle}>Want guidance written for your specific situation?</div>
                      <div style={s.upsellDesc}>With Premium, describe exactly what's happening and get personalised support.</div>
                      <div style={s.upsellLink}>Learn more →</div>
                    </button>
                  )}
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

        <div style={s.inputArea}>
          <div style={s.inputRow}>
            <textarea style={s.input} placeholder="Describe your own situation..." value={inputText} onChange={e => setInputText(e.target.value)} disabled={isProcessing} />
            <button style={{ ...s.sendButton, backgroundColor: inputText.trim() ? 'var(--accent)' : 'var(--text3)' }} onClick={handleSubmit} disabled={!inputText.trim() || isProcessing}>→</button>
          </div>
          {!isPremium && <div style={s.inputNote}>Custom questions are a Premium feature</div>}
        </div>
        {renderSubModal()}
      </div>
    );
  }

  // ─── HUB VIEW ───
  return (
    <div style={s.container}>
      <div style={s.scrollContent}>
        <div style={s.hero}>
          <h1 style={s.heroTitle}>What do you need help with?</h1>
          <p style={s.heroDesc}>Choose a topic. We'll walk through it together, step by step.</p>
        </div>

        <div style={s.modulesGrid}>
          {PRIMARY_MODULES.map(mod => (
            <button key={mod.id} style={s.moduleCard} onClick={() => handleModuleSelect(mod)}>
              <div style={s.moduleCardTitle}>{mod.title}</div>
              <div style={s.moduleCardDesc}>{mod.description}</div>
              <div style={s.moduleCardArrow}>→</div>
            </button>
          ))}
        </div>

        {recentReflection && (
          <div style={s.journeyCard}>
            <div style={s.journeyLabel}>FROM YOUR LAST REFLECTION</div>
            <div style={s.journeyText}>
              {recentReflection.tags?.includes('jealousy') ? 'You reflected on jealousy recently. Ready to work through it?'
                : recentReflection.tags?.includes('boundaries') ? 'You\'ve been thinking about boundaries. Want to draft one?'
                : recentReflection.tags?.includes('communication') ? 'Communication came up recently. Want to prepare a conversation?'
                : 'Continue working through what came up in your last reflection.'}
            </div>
          </div>
        )}
      </div>
      {renderSubModal()}
    </div>
  );
}

const s = {
  container: { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', overflow: 'hidden' },
  scrollContent: { flex: 1, overflow: 'auto', padding: '24px 16px 80px' },

  // Hero
  hero: { marginBottom: '28px', padding: '0 4px' },
  heroTitle: { fontSize: '26px', fontWeight: '700', lineHeight: '34px', margin: '0 0 8px 0', color: 'var(--ink)', letterSpacing: '-0.3px' },
  heroDesc: { fontSize: '15px', lineHeight: '22px', color: 'var(--text2)', margin: 0 },

  // Module Cards
  modulesGrid: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' },
  moduleCard: { display: 'flex', flexDirection: 'column', padding: '14px', borderRadius: '12px', background: 'var(--bg2)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' },
  moduleCardTitle: { fontSize: '16px', fontWeight: '600', color: 'var(--ink)', marginBottom: '4px' },
  moduleCardDesc: { fontSize: '13px', lineHeight: '19px', color: 'var(--text2)', marginBottom: '8px' },
  moduleCardArrow: { fontSize: '16px', fontWeight: '600', color: 'var(--accent)', alignSelf: 'flex-end' },

  // Journey
  journeyCard: { padding: '14px', borderRadius: '12px', background: 'var(--bg2)', border: '1px solid var(--border)', marginBottom: '16px' },
  journeyLabel: { fontSize: '10px', fontWeight: '700', letterSpacing: '1.2px', color: 'var(--text3)', marginBottom: '8px' },
  journeyText: { fontSize: '14px', lineHeight: '21px', color: 'var(--ink)' },

  // Module View
  moduleHeader: { borderBottom: '1px solid var(--border)', padding: '12px 16px 14px' },
  backButton: { background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginBottom: '12px', padding: 0 },
  moduleTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 4px 0', letterSpacing: '-0.3px' },
  moduleDesc: { fontSize: '14px', lineHeight: '20px', color: 'var(--text2)', margin: 0 },

  // Thread
  threadScroll: { flex: 1, overflow: 'auto', padding: '16px 16px 20px' },
  starterContainer: { marginBottom: '16px' },
  starterLabel: { fontSize: '14px', fontWeight: '500', color: 'var(--text2)', marginBottom: '12px', lineHeight: '20px' },
  promptChips: { display: 'flex', flexDirection: 'column', gap: '8px' },
  promptChip: { display: 'flex', alignItems: 'center', padding: '14px', borderRadius: '10px', background: 'var(--bg2)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' },
  promptChipText: { flex: 1, fontSize: '14px', fontWeight: '500', lineHeight: '20px', color: 'var(--ink)' },
  promptChipArrow: { fontSize: '18px', fontWeight: '600', color: 'var(--accent)', marginLeft: '10px' },

  messageContainer: { marginBottom: '24px' },
  userMessageContainer: { marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' },
  userMessage: { maxWidth: '85%', padding: '10px 14px', borderRadius: '14px', background: 'var(--accent)' },
  userMessageText: { color: '#fff', fontSize: '15px', lineHeight: '22px' },

  guideResponseContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
  responseSection: { marginBottom: '12px' },
  sectionHeading: { fontSize: '14px', fontWeight: '700', marginBottom: '4px', color: 'var(--accent)' },
  sectionBody: { fontSize: '14px', lineHeight: '21px', color: 'var(--ink)' },

  processingContainer: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0' },
  processingText: { fontSize: '14px', color: 'var(--text2)' },

  actionButtonsContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' },
  actionButton: { padding: '8px 14px', borderRadius: '20px', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },

  // Upsell
  upsellCard: { display: 'block', width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--bg2)', border: '1px solid var(--border)', marginTop: '24px', cursor: 'pointer', textAlign: 'left' },
  upsellTitle: { fontSize: '15px', fontWeight: '700', color: 'var(--ink)', marginBottom: '4px' },
  upsellDesc: { fontSize: '13px', lineHeight: '19px', color: 'var(--text2)', marginBottom: '8px' },
  upsellLink: { fontSize: '13px', fontWeight: '700', color: 'var(--accent)' },

  // Input Area
  inputArea: { borderTop: '1px solid var(--border)', padding: '10px 16px', background: 'var(--bg2)' },
  inputRow: { display: 'flex', alignItems: 'flex-end', gap: '8px' },
  input: { flex: 1, fontSize: '14px', lineHeight: '20px', minHeight: '44px', maxHeight: '100px', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'inherit', resize: 'none' },
  sendButton: { width: '44px', height: '44px', borderRadius: '22px', border: 'none', color: '#fff', fontSize: '18px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  inputNote: { fontSize: '11px', marginTop: '6px', textAlign: 'center', color: 'var(--text3)' },

  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { width: '90%', maxWidth: '380px', background: 'var(--bg2)', borderRadius: '16px', padding: '24px', position: 'relative' },
  modalClose: { position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: '600', color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 8px 0' },
  modalDesc: { fontSize: '15px', color: 'var(--text2)', margin: '0 0 20px 0', lineHeight: '22px' },
  modalFeatures: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' },
  modalFeatureRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  featureCheck: { width: '22px', height: '22px', borderRadius: '11px', background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modalFeature: { fontSize: '14px', lineHeight: '20px', color: 'var(--ink)' },
  modalButton: { width: '100%', padding: '14px', borderRadius: '10px', background: 'var(--accent)', color: '#fff', border: 'none', fontSize: '16px', fontWeight: '700', cursor: 'pointer' },
  modalDismiss: { width: '100%', padding: '12px', background: 'none', border: 'none', color: 'var(--text3)', fontSize: '14px', fontWeight: '500', cursor: 'pointer', textAlign: 'center', marginTop: '4px' },
};
