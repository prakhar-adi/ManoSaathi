import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Simple singleton to reuse the Gemini client across the app
let cachedModel: GenerativeModel | null = null;

export function getGeminiModel(modelName: string = 'gemini-1.5-flash'): GenerativeModel {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY. Add it to your .env and restart the dev server.');
  }

  if (cachedModel) return cachedModel;

  const genAI = new GoogleGenerativeAI(apiKey);
  cachedModel = genAI.getGenerativeModel({ model: modelName });
  return cachedModel;
}


