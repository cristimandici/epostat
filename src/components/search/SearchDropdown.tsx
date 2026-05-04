'use client';
import { useState, useRef, useEffect } from 'react';
import { Search, Clock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const HISTORY_KEY = 'epostat_search_history';
const MAX_HISTORY = 4;

function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function saveToHistory(q: string) {
  const h = getHistory().filter(s => s.toLowerCase() !== q.toLowerCase());
  h.unshift(q);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)));
}

function removeFromHistory(q: string) {
  const h = getHistory().filter(s => s !== q);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

interface Props {
  placeholder?: string;
  size?: 'default' | 'hero';
  className?: string;
}

export default function SearchDropdown({ placeholder, size = 'default', className }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Autocomplete from DB when typing
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('ads')
        .select('title')
        .eq('status', 'activ')
        .ilike('title', `%${query}%`)
        .limit(6);
      if (data) setSuggestions([...new Set(data.map(d => d.title as string))]);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const navigate = (q: string) => {
    saveToHistory(q.trim());
    setOpen(false);
    setQuery(q);
    router.push(`/anunturi?q=${encodeURIComponent(q.trim())}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(query.trim());
    else router.push('/anunturi');
  };

  const handleFocus = () => {
    setHistory(getHistory());
    setOpen(true);
  };

  const handleRemoveHistory = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    removeFromHistory(item);
    setHistory(getHistory());
  };

  const isHero = size === 'hero';
  const showHistory = open && query.length < 2 && history.length > 0;
  const showSuggestions = open && query.length >= 2 && suggestions.length > 0;
  const showDropdown = showHistory || showSuggestions;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none',
            isHero ? 'w-5 h-5' : 'w-4 h-4 left-3.5'
          )} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={handleFocus}
            placeholder={placeholder || 'Caută anunțuri...'}
            autoComplete="off"
            className={cn(
              'w-full bg-white text-slate-900 placeholder:text-zinc-400 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition rounded-xl',
              isHero
                ? 'pl-12 pr-4 py-4 text-base shadow-lg'
                : 'pl-10 pr-4 py-2.5 text-sm'
            )}
          />
        </div>
        <button
          type="submit"
          className={cn(
            'bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl transition shrink-0',
            isHero ? 'px-6 py-4 text-base' : 'px-4 py-2.5 text-sm'
          )}
        >
          Caută
        </button>
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-14 mt-2 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden z-[100]">
          {showHistory && (
            <>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Căutările tale
              </p>
              {history.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => navigate(item)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition text-left group/item"
                >
                  <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-800 flex-1 truncate">{item}</span>
                  <span
                    role="button"
                    onClick={e => handleRemoveHistory(e, item)}
                    className="opacity-0 group-hover/item:opacity-100 text-zinc-400 hover:text-zinc-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))}
            </>
          )}

          {showSuggestions && (
            <>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Sugestii
              </p>
              {suggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => navigate(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition text-left"
                >
                  <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="text-sm text-slate-800 truncate">{s}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
