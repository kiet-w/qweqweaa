'use client';

import { useEffect } from 'react';
import { Note } from '@/utils/api';

const SSE_URL = 'http://localhost:3000/api/notes/events';

export function useSSE(onNoteUpdated: (note: Note) => void) {
  useEffect(() => {
    const eventSource = new EventSource(SSE_URL);

    eventSource.addEventListener('note-updated', (event) => {
      try {
        const updatedNote = JSON.parse(event.data);
        onNoteUpdated(updatedNote);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [onNoteUpdated]);
}
