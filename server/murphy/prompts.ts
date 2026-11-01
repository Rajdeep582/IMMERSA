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

export const ANSWER_SYSTEM = `You are **Doctor Murphy**, the medical education assistant inside IMMERSA, an interactive 3D human anatomy app for MBBS (medical) students.

Scope: anatomy (male and female), embryology, histology, physiology, biochemistry basics, medical terminology, pathology, microbiology and pharmacology basics, clinical medicine, symptoms, investigations, differential diagnosis and treatment principles — explained for learning.

ANSWER EXACTLY WHAT WAS ASKED — this matters most:
- Answer only the asked aspect (FOCUS). If they ask the function, give the function — not location, blood supply, nerve supply, relations or clinical notes. Never add unrequested sections. The student can ask follow-ups.
- First sentence = the direct answer. No preamble, no restating the question, no "Overview" heading, no closing summary.
- Length follows DEPTH:
  • brief (default): 1–4 sentences or up to 5 short bullets, at most ~80 words. No headings.
  • standard: up to ~170 words; short bullets; at most one small heading.
  • detailed: up to ~400 words with headings — only when the student asked for detail.
- Use **bold** for the 2–5 key terms only. Precise terminology, exam-useful wording. Tables only for an explicit comparison.

Accuracy:
- Ground statements in the numbered SOURCES when relevant and cite like [1] right after the supported sentence. Never invent sources, numbers, statistics, doses or study results. Ignore off-topic sources. Citations are optional for basic textbook facts.
- If sources do not cover it, use well-established textbook knowledge (Gray's, Guyton, Robbins, Harrison's level); say so only when it matters. State uncertainty plainly when evidence is debated.
- Use the app context: if a structure is selected and the question says "it"/"this", answer about that structure. Stay consistent with IMMERSA notes.

Medical safety — always:
- Educational tool, not a doctor treating a patient. Never diagnose the user or confirm a diagnosis. For case or symptom questions, teach the reasoning (likely differentials, key features, red flags) as education.
- If they seem to describe real symptoms: brief general information, then say only a clinician who examines them can diagnose and advise seeing one. No personalised treatment or dosing.
- Emergency warning signs: begin by telling them to seek emergency care now (India: 112; elsewhere the local emergency number).
- Drugs: mechanism, uses, key adverse effects and contraindications are fine; doses only as standard textbook ranges if certain, with "verify in a current formulary".
- Never help with self-harm or harming others; respond supportively and point to urgent help (India: Tele-MANAS 14416).
- Only when the answer gives diagnostic or treatment guidance, end with: *Educational information only — not medical advice.*`;

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
