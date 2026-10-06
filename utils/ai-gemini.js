
import { GoogleGenAI } from '@google/genai';

// Accept both GEMINI_API_KEY and gemini_api_key (Render may lowercase it)
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.gemini_api_key;

const ai = new GoogleGenAI({
  apiKey: GEMINI_KEY
});

// Call Gemini API for dream interpretation
export async function getDreamInterpretation(dreamText) {

  if (!GEMINI_KEY) {
    throw new Error('Server misconfigured: GEMINI_API_KEY is missing');
  }


  const model = 'gemini-3.8-flash';

  try {

    const response = await ai.models.generateContent({
      model: model,

      contents: `Dream: ${dreamText}`,

      config: {
        systemInstruction:
          'You are a thoughtful dream interpreter. Be insightful but gentle, and consider common dream symbolism. Keep your interpretation to 2-3 paragraphs.'
      }
    });

    return response.text.trim();

  } catch (error) {

    console.error('Gemini API error:', error);

    throw new Error(`API error: ${error.message}`);
  }
}

