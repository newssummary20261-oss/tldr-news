// import { GoogleGenerativeAI } from '@google/generative-ai';

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// /**
//  * FREE SUMMARIZER using Google Gemini
//  * 
//  * Free tier limits:
//  * - 15 requests per minute
//  * - 1,500 requests per day
//  * - More than enough for a small news site!
//  */

// export async function generateSummary(headline, content, source, attempt = 1) {
//   // Use Gemini 2.0 Flash Lite (cheapest/free)
//   const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  
//   // Truncate content to save tokens
//   const shortContent = content.substring(0, 500);
  
//   const emphasis = attempt > 1 
//     ? '\n\nIMPORTANT: Use completely different words!' 
//     : '';

//   const prompt = `Rewrite this news in your own words.

// Write:
// 1. New headline (don't copy original)
// 2. 2 sentence summary

// Rules: Use different words. Be factual.
// ${emphasis}

// Headline: ${headline}
// Source: ${source}
// Content: ${shortContent}

// Respond in JSON only, no markdown:
// {"newHeadline": "...", "summary": "..."}`;

//   const result = await model.generateContent(prompt);
//   const text = result.response.text();
  
//   // Clean up response
//   const clean = text.replace(/```json\n?|\n?```/g, '').trim();
//   return JSON.parse(clean);
// }

import OpenAI from 'openai';

const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateSummary(headline, content, source, attempt = 1) {
  const shortContent = content.substring(0, 500);
  
  const emphasis = attempt > 1 
    ? '\n\nIMPORTANT: Use completely different words!' 
    : '';

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `Rewrite this news in your own words.

Write:
1. New headline (don't copy original)
2. 2 sentence summary

Rules: Use different words. Be factual.
${emphasis}

Headline: ${headline}
Source: ${source}
Content: ${shortContent}

JSON only: {"newHeadline": "...", "summary": "..."}`
    }],
  });

  const text = response.choices[0].message.content;
  const clean = text.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(clean);
}