'use client';
import Link from 'next/link';
import { Heart, MapPin, Clock, Eye, Zap } from 'lucide-react';
import { useState } from 'react';
import { Ad } from '@/lib/types';
import { formatPrice, timeAgo, CONDITIONS, CONDITION_COLORS } from '@/lib/data';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface AdCardProps {
  ad: Ad;
  favorited?: boolean;
  onFavoriteToggle?: (id: string, nowFavorited: boolean) => void;
  trending?: boolean;
}

export default function AdCard({ ad, favorited = false, onFavoriteToggle, trending = false }: AdCardProps) {
  const [isFav, setIsFav] = useState(favorited);
  const [favCount, setFavCount] = useState(ad.favorites ?? 0);
  const [loading, setLoading] = useState(false);

  const handleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('ad_id', ad.id);
      setIsFav(false);
      setFavCount(c => Math.max(0, c - 1));
      onFavoriteToggle?.(ad.id, false);
    } else {
      const { error: insErr } = await supabase.from('favorites').insert({ user_id: user.id, ad_id: ad.id });
      if (insErr && insErr.code !== '23505') { setLoading(false); return; }
      setIsFav(true);
      setFavCount(c => c + 1);
      onFavoriteToggle?.(ad.id, true);
    }
    setLoading(false);
  };

  return (
    <Link
      href={`/anunturi/${ad.id}`}
      className="group flex flex-col rounded-xl card-hover"
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-xl aspect-[4/3] bg-zinc-200">
        <img
          src={ad.images[0]}
          alt={ad.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {(ad.favorites ?? 0) >= 1 && (ad.offersCount ?? 0) >= 1 ? (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50/80 backdrop-blur-sm text-orange-500 text-xs font-bold shadow-sm">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" className="shrink-0">
              <path
                d="M6 13.5C3.5 13.5 1 11.8 1 9C1 6.8 2.5 5.5 3.5 4.5C3.5 5.5 4 6 4.5 6C4.5 4 5 2 6.5 0.5C6.5 2.5 7.5 3.5 8.5 4.5C9.5 5.5 11 6.8 11 9C11 11.8 8.5 13.5 6 13.5Z"
                fill="currentColor"
                opacity="0.15"
              />
              <path
                d="M6 13C4 13 2 11.5 2 9C2 7.2 3.2 6 4 5.2C4.1 6 4.5 6.5 5 6.5C5 5 5.4 3.2 6.5 2C6.6 3.8 7.5 4.8 8.3 5.6C9.2 6.5 10 7.5 10 9C10 11.5 8 13 6 13Z"
                fill="currentColor"
              />
              <path
                d="M6 11.5C5 11.5 4 10.8 4 9.5C4 8.5 4.8 7.8 5.2 7.5C5.2 8.2 5.6 8.6 6 8.6C6 7.8 6.3 7 7 6.5C7 7.8 7.8 8.5 8 9.2C8 10.5 7 11.5 6 11.5Z"
                fill="white"
                opacity="0.6"
              />
            </svg>
            e cerut
          </span>
        ) : ad.urgent ? (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-sm">
            <Zap className="w-3 h-3" /> Urgent
          </span>
        ) : null}

        <button
          onClick={handleFav}
          aria-label={isFav ? 'Elimină din favorite' : 'Adaugă la favorite'}
          className={cn(
            'absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm transition-opacity duration-150',
            loading && 'opacity-50 cursor-wait'
          )}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors duration-150',
              isFav ? 'text-red-500 fill-red-500' : 'text-slate-400'
            )}
          />
          {favCount > 0 && (
            <span className={cn('text-xs font-semibold leading-none', isFav ? 'text-red-500' : 'text-slate-500')}>
              {favCount}
            </span>
          )}
        </button>
      </div>

      {/* Text sits on page background – no white box */}
      <div className="px-2 pt-2 pb-1 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mb-1.5">
          {ad.title}
        </h3>

        <div className="flex flex-wrap gap-1 mb-1.5">
          <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-md', CONDITION_COLORS[ad.condition])}>
            {CONDITIONS[ad.condition]}
          </span>
          {ad.negotiable && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
              Negociabil
            </span>
          )}
        </div>

        <p className="text-base font-bold text-slate-900">{formatPrice(ad.price)}</p>

        <div className="mt-auto pt-1.5 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-0.5 min-w-0 mr-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{ad.city}</span>
          </span>
          <span className="flex items-center gap-0.5 shrink-0">
            <Clock className="w-3 h-3 shrink-0" />
            {timeAgo(ad.postedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
