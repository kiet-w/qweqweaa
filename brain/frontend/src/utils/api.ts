import { Note } from '@/types/note';
import axios from 'axios';

const apiInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

type ApiCategory = 'COOKING' | 'TECH' | 'LEARNING' | 'WORK' | 'FINANCE' | 'OTHER';

interface ApiNote {
  id: string;
  url: string | null;
  userInput: string | null;
  aiTitle: string | null;
  aiSummary: string | null;
  aiBullets: string[] | null;
  category: ApiCategory;
  status: Note['status'];
  createdAt: string;
}

const CATEGORY_LABELS: Record<ApiCategory, Note['category']> = {
  COOKING: 'Cooking',
  TECH: 'Tech',
  LEARNING: 'Learning',
  WORK: 'Work',
  FINANCE: 'Finance',
  OTHER: 'Other',
};

export function normalizeNote(note: ApiNote): Note {
  return {
    id: note.id,
    content: note.userInput ?? note.url ?? '',
    title: note.aiTitle ?? undefined,
    category: CATEGORY_LABELS[note.category],
    summary: note.aiSummary ?? undefined,
    bullets: note.aiBullets ?? undefined,
    status: note.status,
    createdAt: note.createdAt,
  };
}

export const api = {
  async fetchNotes(): Promise<Note[]> {
    const res = await apiInstance.get('/notes');
    const notes = res.data as ApiNote[];
    return notes.map(normalizeNote);
  },

  async createNote(content: string): Promise<Note> {
    const res = await apiInstance.post('/notes', { userInput: content });
    return normalizeNote(res.data as ApiNote);
  },

  async searchNotes(query: string): Promise<{ answer: string; relatedNotes?: Note[] }> {
    const res = await apiInstance.post('/notes/search', { query });
    const data = res.data;
    return {
      answer: data.answer,
      relatedNotes: data.relatedNotes ? data.relatedNotes.map(normalizeNote) : undefined,
    };
  },
};

export type { Note };
