'use client';

import { useEffect, useState, useCallback } from 'react';
import NoteInput from '@/components/NoteInput';
import NoteCard from '@/components/NoteCard';
import Sidebar from '@/components/Sidebar';
import { api, Note } from '@/utils/api';
import { useSSE } from '@/hooks/useSSE';

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  const filteredNotes = selectedCategory
    ? notes.filter((n) => n.category === selectedCategory || n.status === 'PROCESSING')
    : notes;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <Sidebar 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory} 
      />
      
      <main className="flex-1 flex flex-col items-center p-8 sm:p-24 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <header className="mb-12">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              {selectedCategory ? `${selectedCategory} Notes` : 'Secondary Brain'}
            </h1>
            <p className="text-zinc-500 text-sm">
              {selectedCategory 
                ? `Showing all insights tagged as ${selectedCategory}` 
                : 'Capture thoughts, let AI organize the chaos.'}
            </p>
          </header>

          <NoteInput onSubmit={handleCapture} />

          <div className="flex flex-col gap-4 mt-8">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm animate-pulse h-32" />
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <p className="text-zinc-500">No notes found here.</p>
                {!selectedCategory && <p className="text-xs text-zinc-400 mt-1">Capture your first thought above!</p>}
              </div>
            ) : (
              filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

