import type { Env } from './providers.js';
import type { Plan, Source } from './types.js';

/**
 * Retrieval from free, authoritative sources (no keys required):
 *  - PubMed (NCBI E-utilities, Best Match relevance): StatPearls chapters (NCBI Bookshelf) and
 *    recent review articles.
 *  - Europe PMC: abstracts for those PubMed IDs in one request.
 *  - MedlinePlus (NLM): plain-language health-topic summaries.
 * Results are re-ranked against the question so off-topic hits are dropped before the model sees them.
 */

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const EPMC = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';
const MEDLINEPLUS = 'https://wsearch.nlm.nih.gov/ws/query';
const TIMEOUT = 6000;

async function get(url: string, signal?: AbortSignal): Promise<Response | null> {
  try {
    const t = AbortSignal.timeout(TIMEOUT);
    const res = await fetch(url, { signal: signal ? AbortSignal.any([signal, t]) : t, headers: { 'user-agent': 'IMMERSA-DoctorMurphy/1.0 (educational anatomy app)' } });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);

async function pubmedIds(term: string, env: Env, signal?: AbortSignal): Promise<string[]> {
  const p = new URLSearchParams({ db: 'pubmed', term, retmode: 'json', retmax: '4', sort: 'relevance', tool: 'immersa', email: env.NCBI_EMAIL || '' });
  if (env.NCBI_API_KEY) p.set('api_key', env.NCBI_API_KEY);
  let res = await get(`${EUTILS}/esearch.fcgi?${p}`, signal);
  if (!res) {
    // Usually a momentary 429 from NCBI's rate limiter: one quick retry.
    await new Promise((r) => setTimeout(r, 450));
    res = await get(`${EUTILS}/esearch.fcgi?${p}`, signal);
  }
  if (!res) return [];
  try {
    const j = (await res.json()) as { esearchresult?: { idlist?: string[] } };
    return j.esearchresult?.idlist ?? [];
  } catch {
    return [];
  }
}

interface EpmcRecord {
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title?: string;
  abstractText?: string;
  pubYear?: string;
  pubTypeList?: { pubType?: string[] };
  journalInfo?: { journal?: { isoabbreviation?: string; title?: string } };
  bookOrReportDetails?: { comprisingTitle?: string };
}

async function abstracts(pmids: string[], signal?: AbortSignal): Promise<Map<string, EpmcRecord>> {
  const out = new Map<string, EpmcRecord>();
  if (!pmids.length) return out;
  const p = new URLSearchParams({ query: `(${pmids.map((id) => `EXT_ID:${id}`).join(' OR ')}) AND SRC:MED`, format: 'json', pageSize: String(pmids.length), resultType: 'core' });
  const res = await get(`${EPMC}?${p}`, signal);
  if (!res) return out;
  try {
    const j = (await res.json()) as { resultList?: { result?: EpmcRecord[] } };
    for (const r of j.resultList?.result ?? []) if (r.pmid) out.set(r.pmid, r);
  } catch {
    /* ignore */
  }
  return out;
}

async function medlinePlus(term: string, signal?: AbortSignal): Promise<Omit<Source, 'n'>[]> {
  if (!term) return [];
  const res = await get(`${MEDLINEPLUS}?${new URLSearchParams({ db: 'healthTopics', term, retmax: '2' })}`, signal);
  if (!res) return [];
  const xml = await res.text();
  const docs: Omit<Source, 'n'>[] = [];
  for (const m of xml.matchAll(/<document[^>]*url="([^"]+)"[^>]*>([\s\S]*?)<\/document>/g)) {
    const field = (name: string) => decode(new RegExp(`<content name="${name}">([\\s\\S]*?)</content>`).exec(m[2]!)?.[1] ?? '');
    const title = field('title');
    const summary = field('FullSummary') || field('snippet');
    if (title && summary) docs.push({ title, url: m[1]!, source: 'MedlinePlus (NLM)', snippet: clip(summary, 1100) });
  }
  return docs;
}

const STOP = new Set('the a an of and or in on to for with what is are how why which does do its it their this that be by as at from vs versus explain describe tell me about'.split(' '));
const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => w.replace(/(ies|es|s)$/, ''));

/** Fraction of query words found in the document (title words count double). */
function relevance(query: string, title: string, text: string): number {
  const q = [...new Set(words(query))];
  if (!q.length) return 0;
  const t = new Set(words(title));
  const b = new Set(words(text));
  let s = 0;
  for (const w of q) s += t.has(w) ? 2 : b.has(w) ? 1 : 0;
  return s / (2 * q.length);
}

export async function retrieve(plan: Plan, env: Env, signal?: AbortSignal, subject?: string): Promise<Omit<Source, 'n'>[]> {
  const queries = plan.search.slice(0, 2).filter(Boolean);
  if (!queries.length) queries.push(plan.resolved);
  // PubMed is rate limited to ~3 requests/s without a key: run the searches in two waves.
  // The structure selected in 3D (e.g. "Left femur" → "femur") when the question is about it.
  const subj = subject?.replace(/^(left|right)\s+/i, '').toLowerCase();
  const aboutSubject = !!subj && plan.resolved.toLowerCase().includes(subj);
  const anatomy = /anatomy|terminology|app/.test(plan.intent) || aboutSubject;
  // NCBI allows ~3 requests/s without a key: combine the queries so a question costs at most 3 searches.
  const any = queries.map((q) => `(${q})`).join(' OR ');
  const core = aboutSubject ? subj! : queries[0]!.replace(/\b(anatomy|anatomical|functions?|structure|roles?|overview|parts?)\b/gi, ' ').trim() || queries[0]!;
  const wave1 = [
    // StatPearls "Anatomy, …" chapters are the best free regional-anatomy reference.
    ...(anatomy ? [`(${core}) AND anatomy[ti] AND statpearls[book]`] : []),
    `(${any}) AND statpearls[book]`,
  ];
  const sp = await Promise.all(wave1.map((t) => pubmedIds(t, env, signal)));
  if (!env.NCBI_API_KEY) await new Promise((r) => setTimeout(r, 340));
  const rv = [await pubmedIds(`(${any}) AND (review[pt] OR systematic[sb]) AND 2014:3000[dp] AND hasabstract`, env, signal)];
  const [abs, mp] = await Promise.all([abstracts([...new Set([...sp.flat().slice(0, 4), ...rv.flat().slice(0, 5)])], signal), medlinePlus(plan.consumer, signal)]);

  const docs: (Omit<Source, 'n'> & { score: number })[] = [];
  const query = [plan.resolved, plan.focus, ...queries].join(' ');
  for (const id of [...new Set([...sp.flat(), ...rv.flat()])]) {
    const r = abs.get(id);
    if (!r?.title || !r.abstractText) continue;
    const isSP = r.bookOrReportDetails?.comprisingTitle === 'StatPearls';
    const journal = r.journalInfo?.journal?.isoabbreviation || r.journalInfo?.journal?.title || 'PubMed';
    const title = decode(r.title).replace(/\.$/, '');
    const text = decode(r.abstractText);
    docs.push({
      title,
      // PubMed record pages work for both journal articles and StatPearls chapters (which link to the full text).
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      source: isSP ? 'StatPearls (NCBI Bookshelf)' : `${journal} — review`,
      year: r.pubYear,
      snippet: clip(text, 1300),
      score: relevance(query, title, text) + (isSP ? 0.15 : 0) + (anatomy && /^Anatomy,/.test(title) ? 0.3 : 0),
    });
  }
  for (const d of mp) docs.push({ ...d, score: relevance(query, d.title, d.snippet) + 0.1 });
  return docs
    .filter((d) => d.score >= 0.34)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map(({ score, ...d }) => (void score, d));
}
