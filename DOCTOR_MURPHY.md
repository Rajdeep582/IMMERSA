# Doctor Murphy — AI medical study assistant

## How it works

```
App (web / Android)                          Serverless function  /api/murphy      (Vercel or Netlify, same code)
──────────────────                           ──────────────────────────────────────────────────────────────
question + chat history  ───────────────▶   1. Understand   Gemini Flash-Lite: fix typos, resolve "it/this"
+ context: selected structure, male/female,                 from the selection and history, plan PubMed queries
  open guide, IMMERSA notes (fuzzy matched)   2. Retrieve     PubMed (Best Match) → StatPearls chapters + recent
                                                              reviews, abstracts via Europe PMC, MedlinePlus;
                                                              re-ranked, off-topic hits dropped
streamed answer + numbered sources ◀──────   3. Answer       Gemini 3.8 Flash, streamed, cites [n], safety rules
```

- The API key exists **only** in the hosting provider's environment variables. It is never in the website bundle or in the APK.
- No database and no extra server. One function file is auto-detected by the host.
- Online only. The 3D anatomy and Learn sections keep working offline in the Android app.

## Model choice (checked Nov 2026)

| Option | Free tier | Quality | Verdict |
|---|---|---|---|
| **Google Gemini 3.8 Flash** (AI Studio) | Yes, with rate limits; no card needed | Frontier-level reasoning; 1M context; GA since Sep 2026 | **Chosen** — strongest model with a genuinely free API |
| Gemini 3.5 Flash-Lite | Yes, separate quota | Fast, cheaper | Used for the quick "understand" step and as a fallback |
| Groq (gpt-oss-120b, Llama 3.3 70B) | Yes (~30 RPM, ~1,000 requests/day) | Good, but weaker than Gemini 3.8 Flash on medicine | Optional backup provider |
| OpenRouter free models | 50 requests/day (1,000 with a $10 top-up) | Varies | Too limited |
| Gemini 4 / 3.1 Pro | Paid only | Best | Upgrade later by changing `MURPHY_MODELS` |

The model is swapped by configuration only (`MURPHY_MODELS`, `MURPHY_PROVIDER`); no code changes are needed.

## Free-tier limits and costs

| Item | Detail |
|---|---|
| Cost | **₹0 as long as billing is NOT enabled** on the Google project that owns the key. Without billing, Google cannot charge you; extra requests just return "quota reached". |
| Limits | Per minute and per day, per model. Google shows your live limits in AI Studio → Rate limits. The daily quota resets at midnight Pacific time (about 12:30–13:30 IST, depending on US daylight saving). Each question uses 1 Flash-Lite call + 1 Flash call. |
| When limits are hit | Doctor Murphy first tries the fallback models, then shows "free usage limit reached — try again later". |
| Privacy | On the free tier, Google may use prompts and answers to improve its products, and humans may review them. The chat asks users not to enter personal details. Upgrade to the paid tier if you need data protection. |
| Region rule | Google's terms allow the free tier for apps used outside the EU, EEA, UK and Switzerland. For users there, a paid key is required. |
| Literature APIs | PubMed, Europe PMC and MedlinePlus are free and need no key. An optional `NCBI_API_KEY` raises the PubMed limit from 3 to 10 requests/second. |
| Hosting | Vercel Hobby: functions run up to 300 s (we set 120 s). Netlify: streamed functions are limited to roughly 30–60 s. |

## Setup

### 1. Get a free key
1. Open https://aistudio.google.com/apikey and click **Create API key** (new project).
2. **Do not** enable billing on that project.

### 2. Website on Vercel (recommended)
1. Import the repository in Vercel. The framework is detected as **Vite** and the `api/` folder as a function.
2. Go to **Project → Settings → Environment Variables** and add `GEMINI_API_KEY` = your key (Production + Preview).
3. Deploy. To check it, open `https://<your-site>/api/murphy` — it should show `{"ok":true,"configured":true,...}`.

Netlify works too: `netlify.toml` and `netlify/functions/murphy.mts` are included. Add the same variable under **Site configuration → Environment variables**.

### 3. Local development
1. Create a file named `.env.local` in the project root containing `GEMINI_API_KEY=your-key`. It is git-ignored.
2. Run `npm run dev`. `/api/murphy` is served locally by the same code.
3. Without a key, you can test the UI with: `MURPHY_PROVIDER=mock npm run dev`

### 4. Android app
The app runs from `https://localhost`, so it must call the deployed website:
1. Create a file named `.env.android` in the project root containing:
   `VITE_MURPHY_API=https://<your-site>/api/murphy`
2. Run `npm run android:apk`.

The URL is public; the key stays on the server. Doctor Murphy shows "Offline" when there is no internet, and the rest of the app keeps working.

## Optional settings (server environment)

| Variable | Default | Purpose |
|---|---|---|
| `MURPHY_MODELS` | `gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite` | Answer models, tried in order |
| `MURPHY_FAST_MODELS` | `gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-3.6-flash` | Question-understanding step |
| `MURPHY_RATE_PER_MINUTE` | `10` | Per-IP limit (best effort) |
| `MURPHY_ALLOWED_ORIGINS` | same site + `https://localhost` | Extra web origins allowed to call the function (comma separated) |
| `OPENAI_COMPAT_BASE_URL`, `OPENAI_COMPAT_API_KEY`, `OPENAI_COMPAT_MODELS` | — | Backup provider, e.g. Groq: `https://api.groq.com/openai/v1`, `openai/gpt-oss-120b` |
| `MURPHY_PROVIDER` | `gemini` | `openai` to use only the compatible provider; `mock` for UI tests |
| `NCBI_API_KEY`, `NCBI_EMAIL` | — | Higher PubMed rate limit |

## Safety behaviour
- Educational framing: Doctor Murphy never confirms a diagnosis. Case questions get differentials, investigations and red flags, presented as teaching.
- Questions that describe personal symptoms get general information plus advice to see a clinician. There is no personalised dosing.
- Emergency features trigger a red banner and emergency advice (India: 112).
- Sources are cited as [n] and can be opened from the chat. When something is not in the sources, the answer says it comes from textbook knowledge.

## Files
| Path | Role |
|---|---|
| `server/murphy/handler.ts` | Endpoint: CORS, validation, rate limit, pipeline, SSE streaming |
| `server/murphy/providers.ts` | Gemini / OpenAI-compatible / mock providers with fallback chain |
| `server/murphy/retrieve.ts` | PubMed, StatPearls, Europe PMC and MedlinePlus retrieval and re-ranking |
| `server/murphy/prompts.ts` | Query-understanding and answer prompts (medical safety rules) |
| `api/murphy.ts`, `netlify/functions/murphy.mts` | Host adapters |
| `src/murphy/*` | Chat UI, context builder, fuzzy name matching, Markdown renderer |
