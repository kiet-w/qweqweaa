'use client';

import { Note } from '@/utils/api';

interface NoteCardProps {
  note: Note;
}

const CATEGORY_ICONS: Record<string, string> = {
  Work: '💼',
  Personal: '👤',
  Idea: '💡',
  Task: '✅',
  Study: '📚',
};

export default function NoteCard({ note }: NoteCardProps) {
  if (note.status === 'PROCESSING') {
    return (
      <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm animate-pulse">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-full mb-2"></div>
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-5/6"></div>
        <div className="mt-4 flex justify-between items-center">
          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-20"></div>
          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full w-24"></div>
        </div>
      </div>
    );
  }

  if (note.status === 'FAILED') {
    return (
      <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 shadow-sm">
        <p className="text-zinc-800 dark:text-zinc-200 line-clamp-2 italic opacity-70">"{note.content}"</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
            ⚠️ Analysis failed
          </span>
          <button 
            className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3 gap-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
          {note.title || 'Untitled Note'}
        </h3>
        {note.category && (
          <span className="shrink-0 text-sm bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded flex items-center gap-1.5">
            <span role="img" aria-label={note.category}>{CATEGORY_ICONS[note.category] || '📝'}</span>
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">{note.category}</span>
          </span>
        )}
      </div>
      
      {note.summary && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
          {note.summary}
        </p>
      )}

      {note.bullets && note.bullets.length > 0 && (
        <ul className="space-y-2 mb-4">
          {note.bullets.map((bullet, i) => (
            <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
          {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
        <div className="relative">
          <span className="text-[10px] text-zinc-400 cursor-default group-hover:text-zinc-500 transition-colors">
            Hover for original
          </span>
          <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-zinc-900 dark:bg-zinc-800 text-zinc-100 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 border border-zinc-700 pointer-events-none">
            <p className="font-medium mb-1 text-zinc-400">Original content:</p>
            <p className="italic">"{note.content}"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
