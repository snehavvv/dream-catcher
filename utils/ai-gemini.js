
import { GoogleGenAI } from '@google/genai';

// Accept both GEMINI_API_KEY and gemini_api_key (Render may lowercase it)
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.gemini_api_key;

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

// Models to try in order if the primary is unavailable
const MODELS = ['gemini-3.8-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];

// Sleep helper
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Call Gemini API for dream interpretation (with retry + model fallback)
export async function getDreamInterpretation(dreamText) {

  if (!GEMINI_KEY) {
    throw new Error('Server misconfigured: GEMINI_API_KEY is missing');
  }

  const systemInstruction =
    'You are a thoughtful dream interpreter. Be insightful but gentle, and consider common dream symbolism. Keep your interpretation to 2-3 paragraphs.';

  for (const model of MODELS) {
    // Retry up to 3 times per model for transient 503/429 errors
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Trying model ${model} (attempt ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: `Dream: ${dreamText}`,
          config: { systemInstruction }
        });
        console.log(`Success with model ${model}`);
        return response.text.trim();

      } catch (error) {
        const status = error.status || error.statusCode;
        const isRetryable = status === 503 || status === 429;
        const isModelGone  = status === 404;

        if (isModelGone) {
          console.warn(`Model ${model} unavailable (404), trying next model...`);
          break; // skip retries, go to next model
        }

        if (isRetryable && attempt < 3) {
          const delay = attempt * 2000; // 2s, 4s
          console.warn(`Model ${model} overloaded (${status}), retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }

        // Last attempt or non-retryable error — try next model
        console.error(`Model ${model} failed (${status}):`, error.message);
        break;
      }
    }
  }

  throw new Error('All Gemini models are currently unavailable. Please try again in a moment.');
}
