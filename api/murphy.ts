// Vercel Function (auto-detected from the /api folder). Set GEMINI_API_KEY in Project → Settings → Environment Variables.
import { handleMurphy } from '../server/murphy/handler.js';

export const config = { maxDuration: 120 };

const handle = (request: Request) => handleMurphy(request, process.env);
export const GET = handle;
export const POST = handle;
export const OPTIONS = handle;
