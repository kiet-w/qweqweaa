const BASE_URL = 'http://localhost:3000/api';

export interface Note {
  id: string;
  content: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  title?: string;
  summary?: string;
  bullets?: string[];
  category?: string;
  createdAt: string;
}

export const api = {
  async getNotes(): Promise<Note[]> {
    const res = await fetch(`${BASE_URL}/notes`);
    if (!res.ok) throw new Error('Failed to fetch notes');
    return res.json();
  },

  async createNote(content: string): Promise<Note> {
    const res = await fetch(`${BASE_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to create note');
    return res.json();
  },
};
