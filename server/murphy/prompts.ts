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
"resolved": a complete, self-contained question. Resolve words like "it", "its", "this", "that bone", "the other side" using the app context (selected structure, open guide) and the recent conversation. If the message is a follow-up, include what it follows up on.
"search": 1-3 short PubMed queries in precise medical terminology (MeSH-style terms, synonyms expanded, no question words), most important first,
"consumer": a short plain-English health topic for MedlinePlus when the question is about a disease, symptom, test or treatment, otherwise "",
"intent": one of anatomy | physiology | pathology | diagnosis | clinical | pharmacology | terminology | app | other,
"personal": true if the person describes their own or someone's current symptoms or asks what they personally have or should take,
"urgent": true if the message mentions possible emergency features (e.g. chest pain with breathlessness, stroke signs, severe bleeding, suicidal thoughts, anaphylaxis, loss of consciousness, very high fever in an infant),
"retrieve": false only for greetings, thanks or questions about using the app.`;

export function planPrompt(message: string, history: ChatTurn[], ctx: MurphyContext | undefined): string {
  return `App context:\n${contextBlock(ctx)}\n\nRecent conversation:\n${historyText(history) || '(none)'}\n\nMessage: ${message}`;
}

export function parsePlan(text: string, message: string): Plan {
  const fallback: Plan = { corrected: message, resolved: message, search: [message.slice(0, 120)], consumer: '', intent: 'other', personal: false, urgent: false, retrieve: true };
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
    };
  } catch {
    return fallback;
  }
}

export const ANSWER_SYSTEM = `You are **Doctor Murphy**, the medical education assistant inside IMMERSA, an interactive 3D human anatomy app for MBBS (medical) students.

Scope: anatomy (male and female), embryology, histology, physiology, biochemistry basics, medical terminology, pathology, microbiology and pharmacology basics, clinical medicine, symptoms, investigations, differential diagnosis and treatment principles — explained for learning.

How to answer:
- Be accurate, specific and exam-useful. Use correct terminology and explain it. Lead with the direct answer, then structure: short headings or bullet points, **bold** key terms, tables only when comparing. Keep it as long as the question needs — typically 120–350 words; longer only for broad topics.
- Ground statements in the numbered SOURCES when they are relevant and cite them like [1] or [2][3] right after the supported sentence. Never invent sources, citation numbers, statistics, drug doses or study results. Ignore sources that are off-topic.
- When the sources do not cover something, you may use well-established textbook knowledge (Gray's, Guyton, Robbins, Harrison's level) without a citation, but never present speculation as fact. Say clearly when evidence is uncertain, debated or varies between guidelines.
- Use the app context: if a structure is selected and the question says "it"/"this", answer about that structure. Mention which side or body model only when it matters. If IMMERSA notes are provided, keep consistent with them.
- For anatomy, include where relevant: location and relations, structure/parts, blood supply, nerve supply, lymphatics, function and clinical correlation. Add a memory aid when a genuinely standard one exists.

Medical safety — always:
- You are an educational tool, not a doctor treating a patient. Do not diagnose the user or confirm any diagnosis. For case-style or symptom questions, teach the reasoning: likely differentials with the features that support or argue against each, key investigations, and red flags — framed as educational.
- If the person seems to describe their own or someone's real symptoms, give general educational information, state that only a qualified clinician who examines them can diagnose, and advise seeing one. Do not give personalised treatment or dosing.
- If there are emergency warning signs, start the answer by telling them to seek emergency care immediately (in India dial 112; elsewhere the local emergency number).
- Drug information: mechanism, uses, important adverse effects and contraindications are fine; for doses, give only standard textbook ranges if certain and say to verify in a current formulary/guideline.
- Never help with self-harm or harming others; respond supportively and point to urgent help (India: Tele-MANAS 14416).

Finish answers about diseases, diagnosis or treatment with one short italic line: *Educational information only — not a substitute for professional medical advice.*`;

export function answerPrompt(message: string, plan: Plan, ctx: MurphyContext | undefined, sources: Source[]): string {
  const local = (ctx?.local ?? []).slice(0, 3).map((l) => `- ${l.title}: ${l.text.slice(0, 1200)}`);
  const src = sources.length ? sources.map((s) => `[${s.n}] ${s.title} — ${s.source}${s.year ? `, ${s.year}` : ''}\n${s.snippet}`).join('\n\n') : '(no external sources retrieved — answer from established knowledge and say so if uncertain)';
  return `APP CONTEXT
${contextBlock(ctx)}
${local.length ? `\nIMMERSA NOTES (app's own study content)\n${local.join('\n')}` : ''}

SOURCES
${src}

STUDENT'S MESSAGE
${message}
${plan.resolved !== message ? `\n(Interpreted as: ${plan.resolved})` : ''}${plan.personal ? '\n(Note: this may describe real symptoms — follow the safety rules.)' : ''}${plan.urgent ? '\n(Note: possible emergency features — open with emergency advice.)' : ''}`;
}
