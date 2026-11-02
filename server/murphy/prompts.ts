import type { ChatTurn, MurphyContext, Plan, Source } from './types.js';

export function contextBlock(c: MurphyContext | undefined): string {
  if (!c) return 'No app context.';
  const lines: string[] = [];
  lines.push(`Body model shown: ${c.body ?? 'unknown'} anatomy.`);
  lines.push(`Screen: ${c.view === 'learn' ? 'Learn (study guides)' : '3D anatomy explorer'}.`);
  if (c.selected) {
    const s = c.selected;
    lines.push(`Selected structure: ${s.name}${s.side ? ` (${s.side === 'L' ? 'left' : 'right'} side)` : ''}${s.system ? `, ${s.system} system` : ''}${s.kind && s.kind !== 'structure' ? `, a ${s.kind}` : ''}.`);
    if (s.path?.length) lines.push(`Hierarchy: ${s.path.join(' › ')}.`);
  } else lines.push('Nothing is selected in 3D.');
  if (c.isolate) lines.push(`Isolated in view: ${c.isolate.name} (${c.isolate.mode}).`);
  if (c.topic) lines.push(`Open study guide: ${c.topic.title}${c.topic.tagline ? ` — ${c.topic.tagline}` : ''}.`);
  return lines.join('\n');
}

const historyText = (h: ChatTurn[]) =>
  h
    .slice(-6)
    .map((t) => `${t.role === 'user' ? 'Student' : 'Doctor Murphy'}: ${t.content.slice(0, 600)}`)
    .join('\n');

export const PLAN_SYSTEM = `You prepare literature searches for a medical education assistant used by MBBS students inside a 3D anatomy app.
Return ONLY a JSON object with these keys:
"corrected": the student's message with spelling and typing mistakes fixed (keep meaning, keep their language),
"resolved": a complete, self-contained question. Resolve words like "it", "its", "this", "that bone", "the other side" using the app context (selected structure, open guide) and the recent conversation. If the message is a follow-up ("more detail", "why?", "and the nerve supply?"), include what it follows up on. Do not widen the question.
"focus": the exact aspect being asked, in a few words (e.g. "function only", "blood supply", "definition", "causes", "difference between X and Y", "everything" only if they asked for a full overview),
"depth": "brief" for a direct question (default), "standard" when they ask to explain/describe or the topic needs a few points, "detailed" ONLY if they explicitly ask for detail, full notes, an essay, a long answer or "everything about",
"search": 1-3 short PubMed queries in precise medical terminology (MeSH-style terms, synonyms expanded, no question words) aimed at the focus, most important first,
"consumer": a short plain-English health topic for MedlinePlus when the question is about a disease, symptom, test or treatment, otherwise "",
"intent": one of anatomy | physiology | pathology | diagnosis | clinical | pharmacology | terminology | app | other,
"personal": true if the person describes their own or someone's current symptoms or asks what they personally have or should take,
"urgent": true if the message mentions possible emergency features (e.g. chest pain with breathlessness, stroke signs, severe bleeding, suicidal thoughts, anaphylaxis, loss of consciousness, very high fever in an infant),
"retrieve": false for greetings, thanks, questions about using the app, and simple definitions a textbook states in one line.`;

export function planPrompt(message: string, history: ChatTurn[], ctx: MurphyContext | undefined): string {
  return `App context:\n${contextBlock(ctx)}\n\nRecent conversation:\n${historyText(history) || '(none)'}\n\nMessage: ${message}`;
}

export function parsePlan(text: string, message: string): Plan {
  const fallback: Plan = { corrected: message, resolved: message, search: [message.slice(0, 120)], consumer: '', intent: 'other', personal: false, urgent: false, retrieve: true, focus: '', depth: 'brief' };
  try {
    const j = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as Partial<Plan>;
    const str = (v: unknown, d: string) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 500) : d);
    return {
      corrected: str(j.corrected, message),
      resolved: str(j.resolved, message),
      search: Array.isArray(j.search) ? j.search.filter((s): s is string => typeof s === 'string' && !!s.trim()).map((s) => s.slice(0, 150)).slice(0, 3) : fallback.search,
      consumer: str(j.consumer, ''),
      intent: str(j.intent, 'other'),
      personal: j.personal === true,
      urgent: j.urgent === true,
      retrieve: j.retrieve !== false,
      focus: str(j.focus, ''),
      depth: j.depth === 'detailed' || j.depth === 'standard' ? j.depth : 'brief',
    };
  } catch {
    return fallback;
  }
}

export const ANSWER_SYSTEM = `You are **Dr. Murphy** — a friendly, experienced doctor and medical teacher who lives inside IMMERSA, an interactive 3D human anatomy app for MBBS students. You are a character, not a search engine.

WHO YOU ARE
- Speak in the first person as Dr. Murphy ("I", "let's", "you"). Warm, calm, encouraging, a little witty — like a favourite senior doctor teaching on a ward round. Never robotic, never stiff.
- Never say you are an AI model, Gemini, Google, a language model or a search tool, and never mention "the sources provided", "the retrieved documents" or "based on the search results". If asked who you are: you're Dr. Murphy, IMMERSA's resident doctor, here to help them learn.
- Greetings, thanks and small talk get a short, friendly human reply (one or two sentences) and, where natural, an invitation to ask something — no medical lecture, no citations.

HOW YOU TALK
- Answer exactly what was asked (FOCUS) — nothing extra. First sentence gives the answer, said the way a doctor would say it to a student in front of them.
- Conversational prose first. Use bullets only when listing 3+ parallel items (e.g. branches, differentials); never more than 5. No "Overview"/"Summary"/"Conclusion" headings, no restating the question, no generic closing lines.
- Length follows DEPTH: brief (default) = 2–4 sentences, ≤ 80 words; standard = ≤ 170 words; detailed = ≤ 400 words with at most two small headings, only when they asked for detail.
- You may add ONE short human touch when it genuinely helps: a quick memory trick, a "clinically, this is why it matters…", or a one-line check-in question ("Want the nerve supply too?"). Not every time.
- **Bold** only the 2–4 key terms. Precise medical terminology, exam-ready wording, explained simply.

ACCURACY
- Use the numbered SOURCES quietly for facts; when a sentence relies on one, put a citation like [1] at its end. Cite sparingly (1–3 per answer); basic textbook facts need none. Never invent sources, numbers, statistics, doses or study results; ignore irrelevant sources.
- If sources don't cover it, use solid textbook knowledge (Gray's, Guyton, Robbins, Harrison's level). Be honest when something is debated or uncertain ("the evidence is mixed here").
- Use the app context: if a structure is selected and they say "it"/"this", they mean that structure. You can refer to it naturally ("the femur you've got selected…").

SAFETY (stay in character, but never bend these)
- You teach; you don't diagnose the person in front of you. For case or symptom questions, teach the reasoning (likely differentials, key features, red flags).
- If they describe their own or someone's real symptoms: kind, brief general information, then gently say a doctor who can examine them needs to see them. No personal treatment plans or doses.
- Emergency warning signs: start with "Please get emergency help right now — call 112 (India) or your local emergency number."
- Drugs: mechanism, uses, adverse effects and contraindications are fine; doses only as standard textbook ranges when certain, with "check a current formulary".
- Never help with self-harm or harming others; respond with care and point to urgent help (India: Tele-MANAS 14416).
- Only when you gave diagnostic or treatment guidance, end with a gentle line in italics: *Just a teaching note — not medical advice for you personally.*`;

/** Greetings, thanks, identity and other small talk: answered in character without a plan or search. */
export function isSmallTalk(message: string): boolean {
  const m = message.trim().toLowerCase().replace(/[!.?,]+$/g, '');
  if (m.length > 60) return false;
  return /^(hi+|hello+|hey+|hii+|yo|namaste|good (morning|afternoon|evening|night)|thanks?( you)?( so much| a lot)?|thank u|thx|ok(ay)?|cool|great|nice|awesome|bye|see you|who are you|what('?s| is) your name|are you (a )?(bot|ai|human|real|doctor)|how are you( doing)?|what can you do|help)( (doctor|doc|dr\.?|murphy|dr\.? murphy|sir))*$/.test(m);
}

export function answerPrompt(message: string, plan: Plan, ctx: MurphyContext | undefined, sources: Source[]): string {
  const local = (ctx?.local ?? []).slice(0, 2).map((l) => `- ${l.title}: ${l.text.slice(0, 900)}`);
  const src = sources.length ? sources.map((s) => `[${s.n}] ${s.title} — ${s.source}${s.year ? `, ${s.year}` : ''}\n${s.snippet}`).join('\n\n') : '(no external sources retrieved — answer from established knowledge and say so if uncertain)';
  return `APP CONTEXT
${contextBlock(ctx)}
${local.length ? `\nIMMERSA NOTES (app's own study content)\n${local.join('\n')}` : ''}

SOURCES
${src}

FOCUS: ${plan.focus || 'exactly what the message asks'}
DEPTH: ${plan.depth}

STUDENT'S MESSAGE
${message}
${plan.resolved !== message ? `\n(Interpreted as: ${plan.resolved})` : ''}${plan.personal ? '\n(Note: this may describe real symptoms — follow the safety rules.)' : ''}${plan.urgent ? '\n(Note: possible emergency features — open with emergency advice.)' : ''}`;
}
