'use client';

import { useEffect, useState, useCallback } from 'react';
import NoteInput from '@/components/NoteInput';
import { api, Note } from '@/utils/api';
import { useSSE } from '@/hooks/useSSE';

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const handleNoteUpdated = useCallback((updatedNote: Note) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
  }, []);

  useSSE(handleNoteUpdated);

  useEffect(() => {
    api.getNotes()
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCapture = async (content: string) => {
    // Optimistic Update
    const tempId = Math.random().toString(36).substring(7);
    const optimisticNote: Note = {
      id: tempId,
      content,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
    };

    setNotes((prev) => [optimisticNote, ...prev]);

    try {
      const realNote = await api.createNote(content);
      // Replace optimistic note with real one
      setNotes((prev) =>
        prev.map((n) => (n.id === tempId ? realNote : n))
      );
    } catch (error) {
      console.error('Failed to capture note:', error);
      // Mark as failed in state
      setNotes((prev) =>
        prev.map((n) =>
          n.id === tempId ? { ...n, status: 'FAILED' } : n
        )
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <main className="flex flex-col items-center p-8 sm:p-24">
        <h1 className="text-4xl font-bold mb-12 text-zinc-900 dark:text-zinc-50">
          Secondary Brain
        </h1>

        <NoteInput onSubmit={handleCapture} />

        <div className="w-full max-w-2xl flex flex-col gap-4">
          {loading ? (
            <p className="text-zinc-500">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="text-zinc-500">No notes yet. Capture your first thought!</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={`p-4 rounded-lg border bg-white dark:bg-zinc-900 shadow-sm transition-opacity ${
                  note.status === 'PROCESSING' ? 'opacity-70 animate-pulse' : 'opacity-100'
                } ${
                  note.status === 'FAILED' ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <p className="text-zinc-800 dark:text-zinc-200">{note.content}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    note.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700' :
                    note.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {note.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
