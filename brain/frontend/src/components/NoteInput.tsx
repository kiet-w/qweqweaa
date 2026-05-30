'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface NoteInputProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
}

export default function NoteInput({ onSubmit, disabled }: NoteInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || disabled) return;
    onSubmit(content);
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm focus-within:shadow-md focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all duration-200">
      <form onSubmit={handleSubmit} className="flex flex-col p-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Capture a thought... (Enter to save)"
          rows={1}
          className="w-full px-4 py-3 bg-transparent border-none focus:ring-0 resize-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 min-h-[52px] max-h-[300px] overflow-y-auto"
          disabled={disabled}
        />
        <div className="flex justify-between items-center px-4 pb-2">
          <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
            {content.length > 0 ? `${content.length} characters` : 'Notion style capture'}
          </div>
          <button
            type="submit"
            disabled={disabled || !content.trim()}
            className="p-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
