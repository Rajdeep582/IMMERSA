import { describe, expect, it } from 'vitest';
import { handleMurphy } from '../server/murphy/handler';
import { parsePlan } from '../server/murphy/prompts';
import { providerFromEnv } from '../server/murphy/providers';
import { mentionedNotes } from '../src/murphy/fuzzy';

describe('Doctor Murphy server', () => {
  it('reports configuration without exposing secrets', async () => {
    const r = await handleMurphy(new Request('http://x/api/murphy'), { GEMINI_API_KEY: 'secret-key' });
    const j = (await r.json()) as Record<string, unknown>;
    expect(j.configured).toBe(true);
    expect(JSON.stringify(j)).not.toContain('secret-key');
  });
  it('refuses when no key is configured', async () => {
    const r = await handleMurphy(new Request('http://x/api/murphy', { method: 'POST', body: JSON.stringify({ message: 'hi' }) }), {});
    expect(r.status).toBe(503);
  });
  it('validates input and allows the Android origin', async () => {
    const bad = await handleMurphy(new Request('http://x/api/murphy', { method: 'POST', body: JSON.stringify({ message: '' }) }), { MURPHY_PROVIDER: 'mock' });
    expect(bad.status).toBe(400);
    const pre = await handleMurphy(new Request('http://x/api/murphy', { method: 'OPTIONS', headers: { origin: 'https://localhost' } }), {});
    expect(pre.headers.get('access-control-allow-origin')).toBe('https://localhost');
    const evil = await handleMurphy(new Request('http://x/api/murphy', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }), {});
    expect(evil.headers.get('access-control-allow-origin')).toBeNull();
  });
  it('parses plans robustly', () => {
    const p = parsePlan('```json\n{"corrected":"femur function","resolved":"What is the function of the femur?","search":["femur"],"urgent":true}\n```', 'femer fuction');
    expect(p.resolved).toContain('femur');
    expect(p.urgent).toBe(true);
    expect(parsePlan('not json', 'abc').resolved).toBe('abc');
  });
  it('chains providers by configuration', () => {
    expect(providerFromEnv({})).toBeNull();
    expect(providerFromEnv({ GEMINI_API_KEY: 'k' })?.name).toBe('gemini');
    expect(providerFromEnv({ GEMINI_API_KEY: 'k', OPENAI_COMPAT_BASE_URL: 'https://api.groq.com/openai/v1', OPENAI_COMPAT_API_KEY: 'g', OPENAI_COMPAT_MODELS: 'm' })?.name).toContain('→');
  });
});

describe('Doctor Murphy context', () => {
  it('finds structures named with typos in the question', () => {
    const t = mentionedNotes('what does the sternocleidomastiod do').map((n) => n.title.toLowerCase());
    expect(t).toContain('sternocleidomastoid');
    expect(mentionedNotes('tell me about the apendix').map((n) => n.title.toLowerCase())).toContain('appendix');
  });
});
