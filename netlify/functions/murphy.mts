// Netlify Function (v2). Set GEMINI_API_KEY in Site configuration → Environment variables.
import { handleMurphy } from '../../server/murphy/handler.js';

export default (request: Request) => handleMurphy(request, process.env);

export const config = { path: '/api/murphy' };
