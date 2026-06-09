'use client';

import { useEffect } from 'react';
import { Note, normalizeNote } from '@/utils/api';

const SSE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/notes/events` : 'http://localhost:3001/notes/events';

export function useSSE(onNoteUpdated: (note: Note) => void) {
  useEffect(() => {
    const eventSource = new EventSource(SSE_URL);

    eventSource.addEventListener('note-updated', (event) => {
      try {
        const updatedNote = normalizeNote(JSON.parse(event.data));
        onNoteUpdated(updatedNote);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    });

    eventSource.onerror = (error) => {
      if (eventSource.readyState === EventSource.CLOSED) {
        console.warn('SSE connection closed:', error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [onNoteUpdated]);
}
