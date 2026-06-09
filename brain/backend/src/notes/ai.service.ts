import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { Category } from './constants';
import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Note } from '@prisma/client';

export const AiAnalysisSchema = z.object({
  title: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()),
  category: z.nativeEnum(Category),
});

export type AiAnalysis = z.infer<typeof AiAnalysisSchema>;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private ai: GoogleGenAI;

  constructor() {
    // Initialize the new Google Gen AI SDK
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async analyze(content: string): Promise<AiAnalysis> {
    this.logger.log('Analyzing content with Gemini 2.0 Flash...');
    
    // Convert Zod schema to JSON Schema for Gemini
    const jsonSchema = zodToJsonSchema(AiAnalysisSchema as any, { target: 'jsonSchema7' });
    
    // Remove the $schema property if present as it might confuse the API
    const responseSchema = jsonSchema as any;
    delete responseSchema.$schema;
    
    // Convert native enum representation to string enum array for JSON Schema compatibility
    if (responseSchema.properties?.category) {
       responseSchema.properties.category = {
         type: "string",
         enum: Object.values(Category)
       };
    }

    const systemPrompt = `You are a highly intelligent "Secondary Brain" assistant.
Your task is to analyze the user's raw notes, ideas, or brain dumps and extract structured knowledge.
You must return the analysis strictly matching the requested JSON schema.`;

    const response = await this.withRetry(() => this.ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { role: 'user', parts: [{ text: content }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    }));

    const responseText = response.text;
    if (!responseText) {
      throw new Error('No response text returned from Gemini');
    }

    // Since we used responseSchema, we can safely parse the JSON
    const parsedJson = JSON.parse(responseText);
    
    // Validate with Zod just to be absolutely certain
    return AiAnalysisSchema.parse(parsedJson);
  }

  async answerQuestion(query: string, notes: Note[]): Promise<string> {
    this.logger.log('Answering question with Gemini 2.0 Flash...');
    
    const context = notes.map(note => `
Title: ${note.aiTitle || 'Untitled'}
Category: ${note.category || 'Uncategorized'}
Summary: ${note.aiSummary || ''}
Bullets: ${note.aiBullets ? (Array.isArray(note.aiBullets) ? note.aiBullets.join(', ') : note.aiBullets) : ''}
`).join('\n---\n');

    const systemPrompt = `You are a highly intelligent "Secondary Brain" assistant.
The user will ask a question. You must answer it based on the following context notes from their Secondary Brain.
If the answer is not in the context, say you don't know based on the provided notes.

Context Notes:
${context}
`;

    const response = await this.withRetry(() => this.ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { role: 'user', parts: [{ text: query }] }
      ],
      config: {
        systemInstruction: systemPrompt,
      }
    }));

    return response.text || 'No answer generated.';
  }

  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (i === maxRetries - 1) throw error;
        
        const isRateLimit = error.status === 429 || error.status === 'RESOURCE_EXHAUSTED' || error.message?.includes('429') || error.message?.includes('Quota exceeded');
        
        if (isRateLimit) {
          // Extract exact retry delay if provided by the API error message, e.g. "Please retry in 35.62s."
          const match = error.message?.match(/retry in (\d+(\.\d+)?)s/);
          const delaySeconds = match ? parseFloat(match[1]) + 1 : 15;
          
          this.logger.warn(`Gemini API Rate Limit (429) hit. Retrying in ${delaySeconds}s... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        } else {
          throw error;
        }
      }
    }
    throw new Error("Max retries exceeded");
  }
}
