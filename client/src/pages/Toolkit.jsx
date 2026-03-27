import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ChevronDown, Check, Loader, X } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'guides',
    title: 'ENM Guides',
    icon: '◎',
    description: 'Start here if you\'re new to ENM or revisiting the fundamentals',
    items: [
      {
        title: 'What is Ethical Non-Monogamy?',
        description: 'Understanding the spectrum of ENM relationships, from polyamory to open relationships.',
        readTime: '6 min read',
        authority: 'Based on frameworks from relationship psychology and the work of researchers including Dr. Elisabeth Sheff, who has conducted the longest-running study on polyamorous families.',
        tryThis: 'Reflection prompt: Write down your current understanding of ENM in 3 sentences. Then ask yourself — what assumptions am I making? Revisit this after reading the full guide and notice what shifted.',
        content: [
          { heading: 'Definition', body: 'Ethical non-monogamy (ENM) is an umbrella term for any relationship structure where all partners give informed, enthusiastic consent to engage in romantic, intimate, or sexual relationships with multiple people. The key word is ethical — meaning honest, consensual, and transparent.' },
          { heading: 'The Spectrum', body: 'ENM exists on a wide spectrum. At one end, you have open relationships where a primary couple agrees to see other people with specific boundaries. In the middle, polyamory involves multiple loving, committed relationships. At the other end, relationship anarchy rejects all hierarchies and predefined relationship rules entirely.' },
          { heading: 'What ENM Is Not', body: 'ENM is not cheating, nor is it an excuse to avoid commitment. It requires more communication, honesty, and emotional labour than monogamy — not less. It is a deliberate choice made by all involved parties, not a unilateral decision.' },
          { heading: 'Core Principles', body: 'Consent: Every person involved has full knowledge and gives genuine agreement. Communication: Regular, honest, proactive conversations about needs, boundaries, and feelings. Respect: Honouring each person\'s autonomy, time, and emotional reality. Transparency: No hidden relationships, secret conversations, or withheld information.' },
          { heading: 'Is ENM Right for You?', body: 'There is no right or wrong relationship structure — only what works for you and those you\'re in relationships with. If you value autonomy, have a high capacity for communication, and feel drawn to building connections beyond a traditional two-person model, exploring ENM may resonate with you. Start slowly, read widely, and talk to people already living this way.' },
        ],
      },
      {
        title: 'Types of ENM Relationships',
        description: 'Polyamory, solo poly, relationship anarchy, open relationships, and more explained.',
        readTime: '8 min read',
        authority: 'Drawn from established relationship models documented in academic literature and widely referenced in ENM-affirming therapy practice.',
        tryThis: 'After reading, identify which 1–2 styles resonate most with you. Write a sentence for each explaining why. Share with a partner or in a Circle discussion to compare perspectives.',
        content: [
          { heading: 'Polyamory', body: 'The practice of engaging in multiple romantic or loving relationships simultaneously, with the full knowledge and consent of everyone involved. Polyamorous relationships can be hierarchical (with a primary partner) or non-hierarchical (where no relationship takes precedence over another).' },
          { heading: 'Solo Polyamory', body: 'A form of polyamory where a person maintains multiple relationships but does not seek to merge their life (finances, housing, identity) with any one partner. Solo poly individuals prioritise personal autonomy while still engaging in deep, meaningful connections.' },
          { heading: 'Kitchen Table Polyamory', body: 'A style where all partners and metamours (your partner\'s other partners) are comfortable socialising together — metaphorically "sitting around the kitchen table." This approach values community, openness, and shared social spaces.' },
          { heading: 'Parallel Polyamory', body: 'A style where a person\'s partners have little to no direct interaction with each other. Each relationship exists independently. This is not about secrecy — it\'s about respecting different comfort levels with metamour involvement.' },
          { heading: 'Open Relationships', body: 'Typically involves a committed couple who agree that one or both partners can have sexual (and sometimes romantic) relationships with other people. The primary relationship remains the central commitment, with outside connections operating within agreed boundaries.' },
          { heading: 'Relationship Anarchy', body: 'A philosophy that rejects predefined categories for relationships. Relationship anarchists don\'t distinguish between "friends" and "partners" based on societal norms — they let each connection define itself organically. There are no default rules; everything is negotiated individually.' },
          { heading: 'Swinging', body: 'Typically involves couples who engage in sexual activities with other couples or individuals, often in social or event-based settings. Swinging tends to focus on sexual exploration rather than building additional romantic relationships.' },
        ],
      },
      {
        title: 'Starting Your ENM Journey',
        description: 'A thoughtful guide for those exploring non-monogamy for the first time.',
        readTime: '7 min read',
        authority: 'Informed by resources widely used in ENM-affirming therapy, including "The Ethical Slut" (Easton & Hardy) and "Polysecure" (Jessica Fern), both foundational texts in the field.',
        tryThis: 'This week, write a personal "why" statement: "I am exploring ENM because..." Keep it honest and revisit it in 30 days to see how your understanding has evolved.',
        content: [
          { heading: 'Start With Self-Reflection', body: 'Before involving anyone else, spend time understanding your own motivations. Why are you drawn to ENM? Is it curiosity, a desire for more connection, a specific unmet need, or a deep philosophical alignment? Understanding your "why" helps you communicate clearly and make intentional choices.' },
          { heading: 'Educate Yourself', body: 'Read foundational books: "The Ethical Slut" by Dossie Easton, "Polysecure" by Jessica Fern, "More Than Two" (with critical reading), and "The Smart Girl\'s Guide to Polyamory" by Dedeker Winston. Join communities like this one. Listen to podcasts. Knowledge reduces fear and builds confidence.' },
          { heading: 'Communicate Early and Often', body: 'If you have an existing partner, this conversation needs to happen before any action. Share what you\'ve been reading, what interests you, what concerns you. Use "I" statements: "I\'ve been thinking about..." rather than "We should..." Give your partner time to process — this is new for them too.' },
          { heading: 'Go Slowly', body: 'There is no rush. Many people spend months or even years in the exploration phase before actively pursuing additional connections. Attend community events, join discussion groups, talk to experienced ENM people. Build your understanding before building new relationships.' },
          { heading: 'Expect Discomfort', body: 'Jealousy, insecurity, and fear are normal — even expected. They are not signs that you\'re doing something wrong. They are signals that need attention. Develop tools for processing these emotions: journalling, therapy, honest conversation with partners, and self-care practices.' },
          { heading: 'Build Your Support System', body: 'Find community. ENM can feel isolating when the people around you don\'t understand your choices. Circles like the ones on Lunara, local meetup groups, and ENM-affirming therapists can provide the support and normalisation you need.' },
        ],
      },
      {
        title: 'ENM & Existing Relationships',
        description: 'How to navigate opening up a monogamous relationship with care and consent.',
        readTime: '7 min read',
        authority: 'Based on therapeutic frameworks used by ENM-affirming couples therapists and informed by attachment theory research (Dr. Sue Johnson, Dr. Jessica Fern).',
        tryThis: 'Before your next conversation about opening up, write down 3 fears and 3 hopes. Share them with your partner using "I" statements: "I feel... because I need..."',
        content: [
          { heading: 'Timing Matters', body: 'Don\'t bring up ENM during a conflict, after a betrayal, or when one partner is vulnerable. Choose a calm, neutral moment. Frame it as an exploration, not a decision. "I\'ve been thinking about something and I want to share it with you" is very different from "I want to see other people."' },
          { heading: 'Your Partner\'s Reaction', body: 'Expect a range of responses — curiosity, fear, anger, excitement, or shutdown. All are valid. Give your partner space to feel their reaction without immediately trying to fix it. They may need days or weeks to process. Respect their timeline.' },
          { heading: 'Negotiate, Don\'t Dictate', body: 'Opening up must be a joint decision. If your partner isn\'t interested, that\'s a legitimate boundary — not a problem to be solved. If you both want to explore, spend significant time discussing structure, boundaries, and fears before taking any action.' },
          { heading: 'Start With Agreements', body: 'Write down your initial agreements together. What are the boundaries? What does "open" mean for you specifically? How will you handle new connections? When will you check in? Having these in writing prevents misunderstandings and gives you something to revisit as you evolve.' },
          { heading: 'Protect What You Have', body: 'The goal of opening up is to add richness to your life — not to replace what already exists. Invest extra care in your existing relationship during the transition. More quality time, more affirmation, more check-ins. The strongest ENM relationships are built on a secure foundation.' },
        ],
      },
      {
        title: 'Kitchen Table vs. Parallel Poly',
        description: 'Understanding different metamour dynamics and finding what works for you.',
        readTime: '5 min read',
        authority: 'These models are widely discussed in polyamorous communities and documented in relationship research by Dr. Elisabeth Sheff and community educators.',
        tryThis: 'Rate your comfort level 1–10 for: (a) having dinner with your metamour, (b) hearing details about your partner\'s other dates, (c) being in a group chat with all partners. Your answers reveal your natural style.',
        content: [
          { heading: 'What is Kitchen Table Poly?', body: 'Kitchen table polyamory describes a relationship network where everyone is comfortable being in each other\'s social space. Partners, metamours, and their extended connections can share meals, attend events together, and maintain friendly relationships. It\'s built on openness and community.' },
          { heading: 'What is Parallel Poly?', body: 'Parallel polyamory means your relationships exist independently of each other. Your partners may know about each other, but they don\'t interact directly. This isn\'t about secrecy — it\'s about respecting individual comfort levels and maintaining distinct relationship spaces.' },
          { heading: 'Neither is Better', body: 'There is no superior approach. Kitchen table works beautifully for people who thrive on community and shared social connection. Parallel works for people who value compartmentalised intimacy and individual relationship autonomy. Most people fall somewhere on a spectrum between the two.' },
          { heading: 'Finding Your Fit', body: 'Consider: Do you feel energised or drained by group social dynamics? Do your partners have compatible social styles? Is your metamour someone you\'d naturally befriend? Are there children involved who benefit from a connected network? Your answer to these questions will guide your natural preference.' },
          { heading: 'It Can Change', body: 'Your preference may shift over time, or differ between relationships. You might be kitchen table with one partner\'s connections and parallel with another\'s. Flexibility and communication — as always — are key.' },
        ],
      },
    ],
  },
  {
    id: 'communication',
    title: 'Communication Frameworks',
    icon: '◇',
    description: 'Tools for clearer, calmer conversations with partners',
    items: [
      {
        title: 'The RADAR Check-in',
        description: 'A structured framework for regular relationship check-ins.',
        readTime: '6 min read',
        authority: 'The RADAR framework was created by relationship educators and is widely used in polyamorous communities as a structured check-in tool recommended by ENM-affirming therapists.',
        tryThis: 'Schedule your first RADAR with a partner this week. Set a timer for 45 minutes. Follow each step: Review → Agree → Discuss → Action → Reconnect. Write down your action items.',
        content: [
          { heading: 'What is RADAR?', body: 'RADAR is a structured check-in framework designed specifically for non-monogamous relationships. It stands for Review, Agree, Discuss, Action, Reconnect. Many poly relationships use it weekly or fortnightly to stay aligned and prevent small issues from becoming big ones.' },
          { heading: 'Review', body: 'Look back at the period since your last check-in. What went well? What felt difficult? Share highlights and lowlights honestly. This isn\'t about blame — it\'s about creating a shared understanding of how things have been.' },
          { heading: 'Agree', body: 'Revisit your existing agreements. Are they still working? Do any need adjusting? As relationships evolve, agreements should evolve too. This step prevents outdated rules from creating unnecessary friction.' },
          { heading: 'Discuss', body: 'Bring up anything that needs attention — a new connection, a scheduling challenge, an emotional need, a boundary concern. This is the space for topics that don\'t come up naturally in daily conversation.' },
          { heading: 'Action', body: 'Decide on concrete next steps. Not vague intentions — specific actions. "I will schedule a solo evening with you this week." "We will revisit the overnight policy next check-in." Action creates accountability.' },
          { heading: 'Reconnect', body: 'End with connection — not logistics. Express appreciation, share something you love about the relationship, do something together that feels nourishing. The check-in should leave you feeling closer, not drained.' },
        ],
      },
      {
        title: 'Nonviolent Communication (NVC)',
        description: 'A communication framework widely used in conflict resolution and therapy settings.',
        readTime: '6 min read',
        authority: 'Developed by clinical psychologist Dr. Marshall Rosenberg. NVC is used globally in mediation, therapy, education, and conflict resolution. Backed by decades of real-world application.',
        tryThis: 'Next time you feel triggered, pause and write: Observation (what happened) → Feeling (what I feel) → Need (what I need) → Request (what I\'m asking for). Practice this script before your next difficult conversation.',
        content: [
          { heading: 'The Four Components', body: 'NVC, developed by Marshall Rosenberg, provides a four-step framework for honest expression: Observations, Feelings, Needs, and Requests. It separates what happened from your interpretation, helping you communicate without triggering defensiveness.' },
          { heading: 'Observations (Not Evaluations)', body: 'Describe what you observed without judgment. "You came home at midnight" is an observation. "You were out too late" is an evaluation. Observations are facts that a camera could record. Evaluations are your interpretations layered on top.' },
          { heading: 'Feelings (Not Thoughts)', body: '"I feel worried" is a feeling. "I feel like you don\'t care" is a thought disguised as a feeling. NVC asks you to identify the genuine emotion underneath your interpretation. Lonely, anxious, hurt, excited, grateful — these are feelings.' },
          { heading: 'Needs (Universal and Valid)', body: 'Every feeling is connected to a need — met or unmet. "I feel anxious because I need reassurance about our connection." Needs are universal: safety, belonging, autonomy, honesty, intimacy. Naming them moves the conversation from blame to understanding.' },
          { heading: 'Requests (Not Demands)', body: 'A request is specific, actionable, and open to negotiation. "Would you be willing to text me when you\'re heading home?" A demand has consequences attached: "You need to text me or I\'ll..." The difference is whether the other person can say no without punishment.' },
        ],
      },
      {
        title: 'Processing Jealousy',
        description: 'A step-by-step approach to understanding and working through jealousy.',
        readTime: '7 min read',
        authority: 'Informed by cognitive behavioural therapy (CBT) techniques and affect labelling research from UCLA, which shows that naming emotions reduces amygdala reactivity.',
        tryThis: 'Create a jealousy journal. Next time jealousy arises, write: (1) What triggered it, (2) What emotion I actually feel, (3) What need is underneath, (4) One concrete thing I can ask for or do for myself.',
        content: [
          { heading: 'Jealousy is Normal', body: 'First: jealousy is not a moral failure. It\'s a signal — usually pointing to an unmet need, a fear, or an insecurity. Even the most experienced ENM practitioners feel jealousy sometimes. The goal isn\'t to eliminate it but to understand and work with it constructively.' },
          { heading: 'Step 1: Name It', body: 'When jealousy hits, pause and name it. "I am feeling jealous right now." Don\'t act on it, don\'t suppress it, just acknowledge it. Naming an emotion reduces its intensity — this is backed by neuroscience.' },
          { heading: 'Step 2: Get Curious', body: 'Ask yourself: What specifically triggered this feeling? Is it fear of replacement? Fear of missing out? Comparison? Insecurity about your own value? The trigger often reveals the real issue, which is almost never about your partner doing something wrong.' },
          { heading: 'Step 3: Identify the Need', body: 'Underneath jealousy is usually an unmet need. Reassurance, quality time, physical affection, verbal affirmation, or simply feeling prioritised. Once you identify the need, you have something concrete to ask for.' },
          { heading: 'Step 4: Communicate', body: 'Share your experience with your partner using NVC principles. "When you spent the weekend away, I felt anxious because I need reassurance about our connection. Could we plan a dedicated evening together this week?" This is vastly more effective than "You made me jealous."' },
          { heading: 'Step 5: Self-Soothe', body: 'Not every jealousy episode requires your partner to fix it. Develop your own toolkit: journalling, exercise, calling a friend, meditation, or engaging in something that makes you feel confident and whole on your own terms.' },
        ],
      },
      {
        title: 'Compersion: Finding Joy',
        description: 'Understanding and cultivating compersion — the opposite of jealousy.',
        readTime: '5 min read',
        authority: 'Compersion is a concept developed within polyamorous communities and increasingly studied in relationship psychology research on empathetic joy and vicarious positive affect.',
        tryThis: 'This week, when your partner shares something positive about another connection, pause before reacting. Notice your body. Can you find even a small spark of happiness for their happiness? Write down what you notice — no judgment.',
        content: [
          { heading: 'What is Compersion?', body: 'Compersion is the feeling of joy that comes from seeing your partner happy in another relationship. It\'s sometimes called "the opposite of jealousy," though that\'s an oversimplification. You can feel both compersion and jealousy about the same situation — they\'re not mutually exclusive.' },
          { heading: 'It\'s Not Required', body: 'Compersion is not a prerequisite for healthy ENM. Some people feel it intensely, others rarely, and some never. All of these are valid. Pressuring yourself (or being pressured) to feel compersion can create shame and resentment. Let it arrive naturally if it\'s going to.' },
          { heading: 'How It Develops', body: 'Compersion often grows from security. When you feel deeply secure in your own relationship — when you trust that your partner\'s other connections don\'t diminish yours — there\'s more space for genuine happiness about their joy. It\'s a byproduct of trust, not a starting point.' },
          { heading: 'Small Steps', body: 'Start by noticing small moments: your partner smiling at a text, coming home energised after seeing someone, sharing a positive experience. Can you sit with that without immediately going to fear? That\'s the beginning of compersion.' },
          { heading: 'Compersion for Yourself', body: 'Don\'t forget that compersion applies to your own experiences too. Allowing yourself to feel fully happy in a new connection — without guilt about your other partners — is its own form of compersion. You deserve joy in all your relationships.' },
        ],
      },
      {
        title: 'Difficult Conversations Guide',
        description: 'How to approach challenging topics with partners.',
        readTime: '6 min read',
        authority: 'Based on principles from "Difficult Conversations" (Stone, Patton & Heen, Harvard Negotiation Project) and active listening techniques used in clinical therapy settings.',
        tryThis: 'Before your next hard conversation, write down: (1) What I want to say, (2) What I think they might feel hearing it, (3) What outcome I hope for. This 2-minute prep dramatically improves how the conversation lands.',
        content: [
          { heading: 'Timing', body: 'Never start a difficult conversation when either person is tired, stressed, hungry, or in a rush. Ask: "There\'s something I\'d like to discuss — when would be a good time?" This gives your partner the chance to be mentally prepared rather than ambushed.' },
          { heading: 'Lead With Intent', body: 'Start by stating why you\'re bringing this up and what you hope to achieve. "I\'m sharing this because I want us to be closer, not because I\'m criticising you." This sets the tone and reduces defensiveness before the content even lands.' },
          { heading: 'One Topic at a Time', body: 'Resist the urge to bundle multiple issues into one conversation. Each topic deserves its own focused attention. If something else comes up, acknowledge it and agree to return to it separately.' },
          { heading: 'Listen More Than You Speak', body: 'After sharing your piece, genuinely listen to your partner\'s response. Don\'t prepare your rebuttal while they\'re talking. Reflect back what you heard: "It sounds like you\'re saying..." This prevents miscommunication and shows respect.' },
          { heading: 'Repair Together', body: 'Difficult conversations can leave both people feeling raw. Always end with reconnection — even if the issue isn\'t fully resolved. A hug, a word of appreciation, an acknowledgement that you both showed up for the hard work. Resolution doesn\'t have to happen in one sitting.' },
        ],
      },
    ],
  },
  {
    id: 'boundaries',
    title: 'Boundary-Setting Templates',
    icon: '◈',
    description: 'Help defining, wording, and holding your boundaries',
    items: [
      {
        title: 'Personal Boundaries Worksheet',
        description: 'Identify your physical, emotional, and time boundaries.',
        readTime: '6 min read',
        authority: 'Grounded in therapeutic boundary work used in DBT (Dialectical Behaviour Therapy) and trauma-informed relationship counselling.',
        tryThis: 'Set a 15-minute timer and complete this: write 3 physical boundaries, 3 emotional boundaries, and 3 time boundaries. For each, note whether it\'s a hard limit or a flexible preference. Share one with a partner this week.',
        content: [
          { heading: 'Why Write Them Down?', body: 'Boundaries that live only in your head are easy to compromise, difficult to communicate, and impossible for partners to respect consistently. Writing them down creates clarity for you and a reference point for your relationships.' },
          { heading: 'Physical Boundaries', body: 'Consider: What kinds of physical touch and intimacy are you comfortable with in different contexts? What are your safer sex practices and requirements? Are there specific acts that are off-limits? What does consent look like for you in practice, not just in theory?' },
          { heading: 'Emotional Boundaries', body: 'Consider: How much detail do you want to know about your partner\'s other relationships? What topics are sensitive for you? How do you need to receive difficult news? What emotional support do you need during transitions or challenges?' },
          { heading: 'Time Boundaries', body: 'Consider: How much time do you need with each partner to feel secure? Are there protected times (mornings, weekends, holidays) that are non-negotiable? How do you handle scheduling conflicts? What\'s your capacity for new connections right now?' },
          { heading: 'Digital Boundaries', body: 'Consider: Are you comfortable with your partner messaging others while you\'re together? What social media sharing is okay? Do you want to know about activity on other platforms? How do you feel about reading message threads?' },
          { heading: 'Review Regularly', body: 'Boundaries are not permanent. What feels right today may shift as you grow, as relationships deepen, or as circumstances change. Schedule regular reviews — ideally during RADAR check-ins — and give yourself permission to update them without guilt.' },
        ],
      },
      {
        title: 'Relationship Agreements Template',
        description: 'A structured template for creating clear agreements with partners.',
        readTime: '7 min read',
        authority: 'Based on collaborative agreement-making practices used by ENM-affirming therapists and informed by consent-based negotiation models.',
        tryThis: 'Sit down with a partner and each write your top 5 agreements independently. Compare lists. Where they overlap, you have alignment. Where they differ, you have your first discussion topics. Schedule a follow-up to revisit in 3 months.',
        content: [
          { heading: 'Agreements vs. Rules', body: 'Agreements are collaboratively created and mutually consented to. Rules are imposed by one person on another. In healthy ENM, you want agreements. Both partners should feel ownership over every item — if one person doesn\'t genuinely agree, it\'s a rule, not an agreement.' },
          { heading: 'Communication Agreements', body: 'How often will you check in? What needs to be disclosed in advance vs. after the fact? How will you handle disagreements? What\'s the protocol when one person needs to renegotiate? Write these down specifically — "regular check-ins" is vague, "weekly RADAR on Sunday evenings" is clear.' },
          { heading: 'Sexual Health Agreements', body: 'What safer sex practices are required? How often will you get tested? How will new sexual partners be disclosed? What happens if an agreement is accidentally broken? These agreements protect everyone involved and should be revisited when anything changes.' },
          { heading: 'Time and Priority Agreements', body: 'How is time allocated? Are there protected evenings together? How are holidays handled? What happens when scheduling conflicts arise? Who gets informed about cancellations and changes? The more specific, the fewer misunderstandings.' },
          { heading: 'New Connection Agreements', body: 'What do you want to know before your partner pursues someone new? Is there a veto or consultation process? How will you handle the initial NRE (new relationship energy) phase? What support do you need during that transition?' },
          { heading: 'Evolution Clause', body: 'Include a built-in mechanism for change. Relationships grow and shift — your agreements should too. Something like: "We agree to revisit these agreements every three months, or whenever one of us feels a change is needed, whichever comes first."' },
        ],
      },
      {
        title: 'Sexual Health Agreements',
        description: 'Framework for safer sex practices, testing, and disclosure.',
        readTime: '5 min read',
        authority: 'Aligned with CDC and WHO sexual health guidelines, adapted for multi-partner relationship contexts by ENM health educators.',
        tryThis: 'Check when you last got tested. If it\'s been more than 3 months, schedule a test this week. Then write down your barrier-use agreements with each partner — if you can\'t, that\'s your next conversation.',
        content: [
          { heading: 'Why This Matters', body: 'In ENM relationships, sexual health is a shared responsibility across a network, not just between two people. Your decisions affect your partners, their partners, and potentially further. Having explicit, written agreements removes ambiguity and protects everyone.' },
          { heading: 'Barrier Use', body: 'Be specific: With whom do you use barriers? For which activities? Are there partners with whom barriers have been mutually removed, and what process led to that decision? What happens if a barrier fails? Specificity prevents assumptions.' },
          { heading: 'Testing Schedule', body: 'Agree on a testing frequency — every 3 months is a common baseline. Decide which tests are included. Share results openly. Some couples test together as a bonding activity. Whatever your approach, make it consistent and non-negotiable.' },
          { heading: 'Disclosure Protocol', body: 'When a new sexual partner enters the picture, who needs to be told, and when? Before or after? How much detail? This isn\'t about control — it\'s about giving everyone the information they need to make their own informed health decisions.' },
          { heading: 'When Agreements Break', body: 'If an agreement is broken — whether by accident or lapse in judgment — what happens? Having a pre-agreed protocol (immediate disclosure, testing, temporary barrier use with all partners) removes panic from the equation and focuses on responsible action.' },
        ],
      },
      {
        title: 'Time & Energy Boundaries',
        description: 'Managing capacity across multiple relationships without burnout.',
        readTime: '5 min read',
        authority: 'Informed by burnout prevention research and capacity management frameworks used in therapeutic and coaching contexts.',
        tryThis: 'Draw your week as a pie chart: work, sleep, solo time, each relationship, friends, family, self-care. Is there enough of each? If solo time or self-care is missing, block it in your calendar this week — non-negotiable.',
        content: [
          { heading: 'The Capacity Question', body: 'Before adding new connections, honestly assess: How much relational energy do you actually have? Consider your work, health, existing relationships, friendships, family obligations, and your need for solitude. Many people overestimate their capacity in the excitement of new possibilities.' },
          { heading: 'Calendar Honesty', body: 'If your week is already full, adding another relationship means something has to give. Be honest about what that is. A new partner shouldn\'t come at the cost of your health, your existing commitments, or your own time. If there\'s no room, there\'s no room.' },
          { heading: 'Protected Time', body: 'Designate non-negotiable time blocks: solo time for yourself, dedicated time with each partner, and time for friendships and family. These aren\'t selfish — they\'re structural requirements for sustainable relationships.' },
          { heading: 'Saying No', body: 'You can love someone and still say no to seeing them this week. Boundaries around time are not rejections — they\'re acts of self-preservation that ultimately make you a better partner. "I don\'t have the capacity right now" is a complete sentence.' },
          { heading: 'Recognising Burnout', body: 'Signs: dreading plans you used to enjoy, emotional numbness, resentment building without clear cause, neglecting your own needs consistently. If these appear, scale back before things break. Rest is not optional in ENM — it\'s infrastructure.' },
        ],
      },
      {
        title: 'Digital Boundaries',
        description: 'Guidelines for social media, messaging, and online presence.',
        readTime: '5 min read',
        authority: 'Informed by digital wellness research and privacy-by-design principles applied to relationship contexts.',
        tryThis: 'Review your phone right now: are notification previews visible on your lock screen? Could someone see something you\'d prefer private? Adjust 3 settings today that improve your digital boundaries.',
        content: [
          { heading: 'Social Media Presence', body: 'Discuss with each partner: Are you comfortable being tagged in posts? Do you want your relationship visible online? What about photos together? For discreet members, a partner posting about you without consent can have real consequences. Always ask first.' },
          { heading: 'Messaging Etiquette', body: 'When is it okay to message your partner while they\'re with someone else? How quickly do you expect responses? Is it acceptable to read your partner\'s messages with others? These questions seem small but cause significant friction when unaddressed.' },
          { heading: 'App Visibility', body: 'If you\'re on community platforms or apps, discuss visibility preferences. Some people are comfortable being publicly visible; others need maximum discretion. Respect your partner\'s visibility needs even if they differ from your own.' },
          { heading: 'Sharing vs. Privacy', body: 'There\'s a difference between transparency and surveillance. You can be fully honest about your relationships without your partner reading every message. Decide together what level of access feels healthy versus what crosses into controlling territory.' },
          { heading: 'When to Disconnect', body: 'Digital connection can create an illusion of constant availability. It\'s healthy to have offline time — for your relationships and for yourself. "I won\'t be checking my phone between 8pm and 8am" is a perfectly valid digital boundary.' },
        ],
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety & Privacy',
    icon: '▣',
    description: 'Privacy, digital safety, and protecting yourself',
    items: [
      {
        title: 'The Lunara Safety Standard',
        description: 'How we protect your privacy: consent architecture, data security, and governance.',
        readTime: '5 min read',
        authority: 'Built on privacy-by-design principles (Ann Cavoukian) and consent architecture models used in trust-and-safety engineering.',
        tryThis: 'Review your Lunara privacy settings right now. Check your visibility mode, photo access, and notification settings. Make sure they match your current comfort level.',
        content: [
          { heading: 'Consent Architecture', body: 'Lunara is built on a principle we call consent architecture — the idea that every interaction should require explicit, informed consent. You cannot message someone without their approval. You cannot view private photos without their permission. Connection requires written intent that the recipient reviews before deciding.' },
          { heading: 'Data Security', body: 'Your data is encrypted in transit and at rest. We do not sell, share, or monetise your personal information. Your relationship style, identity, and connections are treated as sensitive data with the highest level of protection. We use Supabase with row-level security policies to ensure users can only access data they\'re authorised to see.' },
          { heading: 'Verification System', body: 'Our optional verification system uses photo-based identity confirmation to reduce fake accounts and increase trust. Verified members receive a visible badge, and some features (like open visibility mode) are restricted to verified accounts only.' },
          { heading: 'Moderation', body: 'Community circles are moderated for respectful discourse. We have zero tolerance for harassment, discrimination, or non-consensual behaviour. Reports are reviewed within 24 hours, and violations result in immediate action — including permanent removal when warranted.' },
          { heading: 'Your Control', body: 'You control your visibility (discreet, standard, or open), your photo access, your bio content, and who can contact you. You can block any member instantly, report any behaviour, and delete your account and all associated data at any time.' },
        ],
      },
      {
        title: 'First Meeting Safety',
        description: 'Practical safety tips for your first in-person interaction with a community member.',
        readTime: '5 min read',
        authority: 'Based on personal safety best practices recommended by safety advocacy organisations and adapted for ENM community contexts.',
        tryThis: 'Set up a "safe call" system before your next in-person meeting: tell a trusted friend the who, where, and when. Agree on a check-in time and a code word. Practice it once so it feels natural.',
        content: [
          { heading: 'Before Meeting', body: 'Have at least several conversations through Lunara\'s messaging before agreeing to meet. Look for consistency in what they share. Check their community activity — are they engaged in circles? Do they have a verified account? These are trust signals.' },
          { heading: 'Location', body: 'Always meet in a public place for the first time. Choose somewhere you\'re familiar with and comfortable in. Avoid isolated locations, private residences, or anywhere that requires you to depend on the other person for transport.' },
          { heading: 'Tell Someone', body: 'Share your plans with a trusted friend: who you\'re meeting, where, and when you expect to be home. Arrange a check-in time. Some people use a "safe call" system where a friend calls at a set time and you use a code word to signal if you need help.' },
          { heading: 'Trust Your Instincts', body: 'If something feels off — before or during the meeting — trust that feeling. You do not owe anyone your time, your explanation, or a second chance. Leaving early is always acceptable. "I\'m not feeling well" is a complete exit strategy.' },
          { heading: 'After Meeting', body: 'Take time to reflect on how you felt during the meeting. Did they respect your boundaries? Were they consistent with their online persona? Did you feel safe and heard? These reflections help you make informed decisions about continuing the connection.' },
        ],
      },
      {
        title: 'Recognizing Red Flags',
        description: 'Common warning signs in ENM contexts and how to respond.',
        readTime: '6 min read',
        authority: 'Informed by patterns documented in abuse prevention research and widely observed in ENM community safety discourse.',
        tryThis: 'Think of a current or past connection. Score them on: respects boundaries (Y/N), transparent about other partners (Y/N), comfortable with your pace (Y/N), encourages your community involvement (Y/N). Any "N" is worth a conversation.',
        content: [
          { heading: 'Pressure to Move Quickly', body: 'Anyone who pushes you to meet immediately, share personal information fast, or escalate intimacy before you\'re ready is showing a red flag. Healthy connections respect your pace. "If you were really interested, you\'d..." is manipulation, not enthusiasm.' },
          { heading: 'Secrecy About Other Partners', body: 'In ethical non-monogamy, "ethical" means transparent. If someone is vague about their other relationships, refuses to discuss their partner situation, or asks you to keep your connection secret, they may not be practising ENM ethically.' },
          { heading: 'Disrespecting Boundaries', body: 'If you set a boundary and the person repeatedly tests, questions, or ignores it, that\'s a clear warning sign. Boundary respect is non-negotiable. One accidental overstep followed by a genuine apology is different from a pattern of pushing.' },
          { heading: 'Love-Bombing', body: 'Excessive attention, flattery, and declarations of deep connection very early on can be a manipulation tactic. Genuine connection builds gradually. If someone is "all in" before they truly know you, be cautious about what they\'re actually connecting to.' },
          { heading: 'Isolation Attempts', body: 'Anyone who tries to discourage you from talking to other community members, sharing experiences in circles, or maintaining your support network is displaying controlling behaviour. Healthy partners encourage your connections, not limit them.' },
          { heading: 'How to Respond', body: 'Trust your instincts. Document concerning behaviour. Talk to trusted friends or community members. Use Lunara\'s reporting system. You don\'t need to give someone the benefit of the doubt at the expense of your safety.' },
        ],
      },
      {
        title: 'Privacy for Discreet Members',
        description: 'How to maintain privacy when your ENM status isn\'t publicly known.',
        readTime: '5 min read',
        authority: 'Informed by privacy-by-design principles and community-driven safety practices for marginalised and discreet populations.',
        tryThis: 'Do a quick privacy audit: search your own name online. Check what apps have notification previews enabled. Review which photos you\'ve shared on Lunara. Tighten one thing today.',
        content: [
          { heading: 'You Don\'t Owe Anyone Disclosure', body: 'Your relationship structure is personal information. You have no obligation to share it with colleagues, family, or anyone outside your relationships. Choosing discretion is not dishonesty — it\'s a reasonable response to a world that doesn\'t always understand ENM.' },
          { heading: 'Lunara\'s Discreet Mode', body: 'Our discreet visibility setting blurs your profile photo by default and limits who can see your profile. You control exactly who sees your full identity, and you can grant or revoke access at any time. Your name on Lunara doesn\'t need to be your legal name.' },
          { heading: 'Digital Footprint', body: 'Be mindful of linked accounts, shared devices, and notification previews. Use Lunara\'s in-app messaging rather than moving to platforms that might expose your activity. Review your phone\'s notification settings to prevent accidental visibility.' },
          { heading: 'Communicating With Partners', body: 'Let your partners know about your privacy needs early. A good partner will respect your boundaries around discretion. Discuss what can be shared, with whom, and in what contexts. This isn\'t about hiding — it\'s about controlling your own narrative.' },
          { heading: 'Building Trust Gradually', body: 'In discreet mode, connections take longer to develop — and that\'s okay. The people who are willing to engage with you through the intent process, without seeing your full profile upfront, are demonstrating patience and respect. Those are good signals.' },
        ],
      },
      {
        title: 'Reporting & Support',
        description: 'How to report violations and access support within the Lunara community.',
        readTime: '4 min read',
        authority: 'Moderation practices based on trust-and-safety industry standards used by community-focused platforms.',
        tryThis: 'Familiarise yourself with the reporting flow: go to any member profile and locate the report option. Knowing where it is before you need it removes hesitation in a real situation.',
        content: [
          { heading: 'What to Report', body: 'Report any behaviour that violates community standards: harassment, unsolicited explicit content, threats, impersonation, boundary violations, hate speech, or any conduct that makes you feel unsafe. When in doubt, report — our team would rather review something unnecessary than miss something harmful.' },
          { heading: 'How to Report', body: 'You can report any member directly from their profile or from within a conversation. Reports include a description field where you can provide context. Screenshots are helpful if available. All reports are confidential — the reported person will not know who filed the report.' },
          { heading: 'What Happens Next', body: 'Our moderation team reviews all reports within 24 hours. Depending on severity, outcomes range from a warning to immediate permanent removal. Serious violations (threats, non-consensual content) result in instant account suspension pending review.' },
          { heading: 'Blocking', body: 'You can block any member at any time, instantly. Blocking is mutual and complete: they cannot see your profile, send you messages, or interact with you in any way. They are not notified of the block. You can unblock at any time from your Privacy Settings.' },
          { heading: 'External Support', body: 'If you experience behaviour that extends beyond Lunara — stalking, threats, or abuse — please contact local authorities. We cooperate fully with law enforcement when member safety is at risk. You can also reach our support team directly at hello@lunara.community for urgent safety concerns.' },
        ],
      },
    ],
  },
];

export default function Toolkit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [completed, setCompleted] = useState({});
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  document.title = 'Lunara';

  useEffect(() => {
    loadData();
  }, [user?.id]);

  async function loadData() {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // Fetch completed guides
      const { data: completedData } = await supabase
        .from('guide_completions')
        .select('guide_id')
        .eq('user_id', user.id);

      const completedMap = {};
      if (completedData) {
        completedData.forEach((item) => {
          completedMap[item.guide_id] = true;
        });
      }
      setCompleted(completedMap);
    } catch (err) {
      console.log('Toolkit data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const toggleCategory = (categoryId) => {
    setExpanded((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handlePillClick = (categoryId) => {
    if (categoryId === null) {
      // "All resources" - expand all
      const allExpanded = {};
      CATEGORIES.forEach((cat) => {
        allExpanded[cat.id] = true;
      });
      setExpanded(allExpanded);
    } else {
      // Expand specific category
      setExpanded((prev) => ({
        ...prev,
        [categoryId]: true,
      }));
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const toggleCompleted = async (itemTitle) => {
    if (!user?.id) return;

    const newState = !completed[itemTitle];
    setCompleted((prev) => ({
      ...prev,
      [itemTitle]: newState,
    }));

    try {
      if (newState) {
        await supabase.from('guide_completions').insert({
          user_id: user.id,
          guide_id: itemTitle,
          completed_at: new Date().toISOString(),
        });
      } else {
        await supabase
          .from('guide_completions')
          .delete()
          .eq('user_id', user.id)
          .eq('guide_id', itemTitle);
      }
    } catch (err) {
      console.log('Error updating guide completion:', err);
    }
  };

  if (loading) {
    return (
      <div className="page page-center">
        <Loader size={32} className="spin" />
      </div>
    );
  }

  const completedCount = Object.values(completed).filter(Boolean).length;
  const totalGuides = CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="page" style={{ overflow: 'auto', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.eyebrow}>RELATIONSHIP TOOLKIT</div>
        <h1 style={s.title}>Resources</h1>
        <p style={s.subtitle}>
          Practical tools and guides for every stage of your ENM journey
        </p>
      </div>

      {/* Stats Banner */}
      <div style={s.statsBanner}>
        <div style={s.stat}>
          <div style={s.statNumber}>20+</div>
          <div style={s.statLabel}>Guides</div>
        </div>
        <div style={s.statDivider} />
        <div style={s.stat}>
          <div style={s.statNumber}>4</div>
          <div style={s.statLabel}>Categories</div>
        </div>
        <div style={s.statDivider} />
        <div style={s.stat}>
          <div style={s.statNumber}>{completedCount}</div>
          <div style={s.statLabel}>Completed</div>
        </div>
      </div>

      {/* Problem-Led Entry Pills */}
      <div style={s.problemLedSection}>
        <h3 style={s.problemLedTitle}>What do you need help with?</h3>
        <div style={s.pillsContainer}>
          <button
            style={s.pill}
            onClick={() => handlePillClick('guides')}
          >
            I'm new to ENM
          </button>
          <button
            style={s.pill}
            onClick={() => handlePillClick('boundaries')}
          >
            Better boundaries
          </button>
          <button
            style={s.pill}
            onClick={() => handlePillClick('communication')}
          >
            Handling jealousy
          </button>
          <button
            style={s.pill}
            onClick={() => handlePillClick('communication')}
          >
            Communication tools
          </button>
          <button
            style={s.pill}
            onClick={() => handlePillClick('safety')}
          >
            Safety & privacy
          </button>
          <button
            style={s.pill}
            onClick={() => handlePillClick(null)}
          >
            All resources
          </button>
        </div>
      </div>

      {/* Categories */}
      <div style={s.categoriesContainer}>
        {CATEGORIES.map((category) => (
          <div key={category.id} style={s.categoryCard}>
            <button
              style={s.categoryHeader}
              onClick={() => toggleCategory(category.id)}
            >
              <div style={s.categoryIconWrap}>{category.icon}</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={s.categoryTitle}>{category.title}</div>
                <div style={s.categoryDesc}>{category.description}</div>
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '300',
                color: 'var(--text3)',
                transition: 'transform 0.2s',
                transform: expanded[category.id] ? 'rotate(0deg)' : 'rotate(0deg)',
              }}>
                {expanded[category.id] ? '−' : '+'}
              </div>
            </button>

            {expanded[category.id] && (
              <div style={s.itemsContainer}>
                {category.items.map((item, index) => (
                  <button
                    key={item.title}
                    style={{
                      ...s.itemCard,
                      borderBottom: index === category.items.length - 1 ? 'none' : '1px solid var(--border)',
                    }}
                    onClick={() => handleItemClick(item)}
                  >
                    <div style={{
                      ...s.itemNumber,
                      background: completed[item.title] ? 'var(--sage-light)' : 'rgba(167, 139, 250, 0.1)',
                    }}>
                      {completed[item.title] ? (
                        <span style={{ color: 'var(--sage)' }}>✓</span>
                      ) : (
                        <span style={{ color: 'var(--accent)' }}>{index + 1}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, marginLeft: '12px' }}>
                      <div style={s.itemTitle}>{item.title}</div>
                      <div style={s.itemDesc}>{item.description}</div>
                      <div style={s.itemReadTime}>{item.readTime} →</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Section */}
      <div style={s.contactCard}>
        <h3 style={s.contactTitle}>Need support?</h3>
        <p style={s.contactDesc}>
          Our team is here to help with safety concerns, community questions, or general support.
        </p>
        <div style={s.contactEmail}>hello@lunara.community</div>
        <div style={s.contactResponse}>Response within 24 hours</div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          isCompleted={completed[selectedItem.title]}
          onToggleCompleted={() => toggleCompleted(selectedItem.title)}
        />
      )}
    </div>
  );
}

function DetailModal({ item, onClose, isCompleted, onToggleCompleted }) {
  const navigate = useNavigate();

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>

        <div style={s.detailHeader}>
          <h2 style={s.modalTitle}>{item.title}</h2>
          <p style={s.modalMeta}>{item.readTime}</p>
        </div>

        <div style={s.modalContent}>
          <p style={s.modalIntro}>{item.description}</p>

          <div style={s.divider} />

          {/* Authority anchor */}
          {item.authority ? (
            <div style={s.authorityBox}>
              <div style={s.authorityLabel}>FRAMEWORK BASIS</div>
              <p style={s.authorityText}>{item.authority}</p>
            </div>
          ) : null}

          {/* Content sections */}
          {item.content.map((section, index) => (
            <div key={index} style={s.contentSection}>
              <h3 style={s.sectionHeading}>{section.heading}</h3>
              <p style={s.sectionBody}>{section.body}</p>
            </div>
          ))}

          {/* Try This section */}
          {item.tryThis ? (
            <div style={s.tryThisBox}>
              <div style={s.tryThisLabel}>TRY THIS NOW</div>
              <p style={s.tryThisText}>{item.tryThis}</p>
              <button
                style={s.tryThisLink}
                onClick={() => navigate('/circles')}
              >
                Discuss this in your Circle →
              </button>
            </div>
          ) : null}

          {/* What's Next section */}
          <div style={s.whatsNextSection}>
            <h3 style={s.whatsNextTitle}>What's Next</h3>
            <button style={s.whatsNextBtn} onClick={() => navigate('/circles')}>
              Discuss in a Circle
            </button>
            <button style={s.whatsNextBtn} onClick={() => navigate('/guide')}>
              Ask the Guide about this
            </button>
          </div>

          {/* Completion */}
          <button
            style={{
              ...s.completedBtn,
              color: isCompleted ? 'var(--sage)' : 'var(--text3)',
            }}
            onClick={onToggleCompleted}
          >
            {isCompleted ? '✓ Completed' : '○ Mark as completed'}
          </button>

          <div style={s.detailFooter}>
            Part of the Lunara Relationship Toolkit — a structured system for building intentional, consent-led relationships.
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  // Header
  header: {
    padding: '24px 20px',
    borderBottomLeftRadius: '28px',
    borderBottomRightRadius: '28px',
    background: 'var(--bg2)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
  },
  eyebrow: {
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '2px',
    marginBottom: '12px',
    color: 'var(--accent)',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.3px',
    margin: '0 0 8px 0',
    color: 'var(--ink)',
  },
  subtitle: {
    fontSize: '14px',
    lineHeight: '20px',
    color: 'var(--text2)',
    margin: 0,
  },

  // Stats
  statsBanner: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    margin: '16px 20px',
    padding: '16px',
    borderRadius: '16px',
    background: 'rgba(167, 139, 250, 0.1)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  stat: { textAlign: 'center' },
  statNumber: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--accent)',
  },
  statLabel: {
    fontSize: '11px',
    marginTop: '4px',
    color: 'var(--text3)',
  },
  statDivider: {
    width: '1px',
    height: '32px',
    background: 'rgba(0,0,0,0.1)',
  },

  // Problem-led pills
  problemLedSection: {
    margin: '12px 20px 16px 20px',
  },
  problemLedTitle: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '12px',
    margin: '0 0 12px 0',
    color: 'var(--ink)',
  },
  pillsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  pill: {
    padding: '10px 16px',
    borderRadius: '20px',
    border: '1px solid var(--border)',
    background: 'var(--bg2)',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--ink)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Categories
  categoriesContainer: {
    margin: '12px 20px 32px 20px',
  },
  categoryCard: {
    borderRadius: '16px',
    marginBottom: '12px',
    background: 'var(--bg2)',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    width: '100%',
    gap: '12px',
  },
  categoryIconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'rgba(167, 139, 250, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0,
  },
  categoryTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--ink)',
    margin: 0,
  },
  categoryDesc: {
    fontSize: '12px',
    color: 'var(--text2)',
    marginTop: '2px',
    margin: '2px 0 0 0',
  },

  // Items
  itemsContainer: {
    borderTop: '1px solid var(--border)',
    padding: '0 16px',
  },
  itemCard: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '12px 0',
    borderBottom: '1px solid var(--border)',
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
    background: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    gap: '12px',
  },
  itemNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--accent)',
    flexShrink: 0,
    marginTop: '2px',
  },
  itemTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--ink)',
    marginBottom: '2px',
    margin: 0,
  },
  itemDesc: {
    fontSize: '13px',
    color: 'var(--text2)',
    lineHeight: '19px',
    margin: '2px 0 0 0',
  },
  itemReadTime: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--accent)',
    marginTop: '6px',
    margin: '6px 0 0 0',
  },

  // Contact card
  contactCard: {
    margin: '12px 20px 32px 20px',
    padding: '16px',
    borderRadius: '16px',
    background: 'var(--bg2)',
  },
  contactTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--ink)',
    margin: '0 0 8px 0',
  },
  contactDesc: {
    fontSize: '14px',
    color: 'var(--text2)',
    margin: '8px 0',
  },
  contactEmail: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--accent)',
    margin: '8px 0',
  },
  contactResponse: {
    fontSize: '12px',
    color: 'var(--text3)',
  },

  // Modal styles
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
  modal: {
    width: '100%',
    maxHeight: '90vh',
    background: 'var(--bg)',
    borderTopLeftRadius: '28px',
    borderTopRightRadius: '28px',
    padding: '20px',
    overflow: 'auto',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '16px',
    width: '32px',
    height: '32px',
    border: 'none',
    background: 'var(--bg2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    color: 'var(--text2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },

  detailHeader: {
    paddingRight: '40px',
  },
  modalTitle: {
    fontSize: '26px',
    fontWeight: '800',
    lineHeight: '32px',
    letterSpacing: '-0.3px',
    color: 'var(--ink)',
    margin: '0 0 4px 0',
  },
  modalMeta: {
    fontSize: '13px',
    color: 'var(--text2)',
    margin: '0 0 16px 0',
  },
  modalIntro: {
    fontSize: '15px',
    lineHeight: '23px',
    color: 'var(--text2)',
    margin: '0 0 16px 0',
  },

  divider: {
    height: '1px',
    background: 'var(--border)',
    margin: '16px 0',
  },

  // Authority box
  authorityBox: {
    borderRadius: '8px',
    padding: '16px',
    background: 'rgba(115, 168, 125, 0.1)',
    borderLeft: '4px solid var(--sage)',
    marginBottom: '16px',
  },
  authorityLabel: {
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--sage)',
    marginBottom: '4px',
    margin: '0 0 4px 0',
  },
  authorityText: {
    fontSize: '13px',
    color: 'var(--ink)',
    margin: 0,
    lineHeight: '19px',
  },

  // Content sections
  contentSection: {
    marginBottom: '16px',
  },
  sectionHeading: {
    fontSize: '17px',
    fontWeight: '700',
    marginBottom: '8px',
    margin: '0 0 8px 0',
    color: 'var(--ink)',
  },
  sectionBody: {
    fontSize: '15px',
    lineHeight: '24px',
    color: 'var(--text2)',
    margin: 0,
  },

  // Try This box
  tryThisBox: {
    borderRadius: '8px',
    padding: '16px',
    background: 'rgba(167, 139, 250, 0.1)',
    borderLeft: '4px solid var(--accent)',
    marginBottom: '16px',
  },
  tryThisLabel: {
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--accent)',
    marginBottom: '4px',
    margin: '0 0 4px 0',
  },
  tryThisText: {
    fontSize: '13px',
    color: 'var(--ink)',
    margin: '0 0 12px 0',
    lineHeight: '19px',
  },
  tryThisLink: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--accent)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
  },

  // What's Next
  whatsNextSection: {
    marginTop: '24px',
    marginBottom: '24px',
  },
  whatsNextTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--ink)',
    margin: '0 0 12px 0',
  },
  whatsNextBtn: {
    width: '100%',
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    background: 'var(--bg2)',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--ink)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Completed button
  completedBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    background: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Footer
  detailFooter: {
    borderRadius: '8px',
    padding: '16px',
    background: 'rgba(167, 139, 250, 0.1)',
    marginTop: '16px',
    fontSize: '13px',
    lineHeight: '19px',
    textAlign: 'center',
    color: 'var(--accent)',
  },

  modalContent: {
    marginTop: '16px',
  },
};
