'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Heart, Search } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/data';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&auto=format';

interface FavAd {
  id: string;
  title: string;
  price: number;
  images: string[];
  city: string;
}

export default function FavoritesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [ads, setAds] = useState<FavAd[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setSearch(''); return; }
    setLoading(true);
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      const { data: favIds } = await supabase
        .from('favorites').select('ad_id').eq('user_id', user.id);
      const ids = (favIds || []).map((f: { ad_id: string }) => f.ad_id);
      if (!ids.length) { setAds([]); setLoading(false); return; }
      const { data } = await supabase
        .from('ads').select('id, title, price, images, city')
        .in('id', ids).eq('status', 'activ')
        .order('created_at', { ascending: false });
      setAds((data || []) as FavAd[]);
      setLoading(false);
    });
    setTimeout(() => searchRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const filtered = ads.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Panel – full-screen on mobile, right-side drawer on desktop */}
      <div className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-[420px] z-50 bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <h2 className="font-bold text-slate-900 text-lg">Favorite</h2>
            {ads.length > 0 && (
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {ads.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition text-slate-500"
            aria-label="Închide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Caută în favorite..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <Heart className="w-14 h-14 text-slate-200 mb-4" />
              <p className="font-bold text-slate-700 text-base mb-1">
                {search ? 'Niciun rezultat' : 'Niciun anunț salvat'}
              </p>
              <p className="text-slate-400 text-sm">
                {search ? 'Încearcă alt termen de căutare.' : 'Apasă ♡ pe orice anunț pentru a-l salva aici.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(ad => (
                <Link
                  key={ad.id}
                  href={`/anunturi/${ad.id}`}
                  onClick={onClose}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition group"
                >
                  <img
                    src={ad.images?.[0] || PLACEHOLDER}
                    alt={ad.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition">
                      {ad.title}
                    </p>
                    <p className="text-[#2563EB] font-black text-base mt-1">
                      {formatPrice(ad.price)}
                    </p>
                    {ad.city && (
                      <p className="text-xs text-slate-400 mt-0.5">{ad.city}</p>
                    )}
                  </div>
                  <Heart className="w-4 h-4 text-red-400 fill-red-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
