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
}

export default function AdCard({ ad, favorited = false, onFavoriteToggle }: AdCardProps) {
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
      className="group flex flex-col rounded-xl ring-1 ring-transparent hover:ring-zinc-200 hover:shadow-sm transition-all duration-200"
    >
      {/* Image – rounded corners on the image itself, not on a white box */}
      <div className="relative overflow-hidden rounded-xl aspect-[4/3] bg-zinc-200">
        <img
          src={ad.images[0]}
          alt={ad.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {ad.urgent && (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-sm">
            <Zap className="w-3 h-3" /> Urgent
          </span>
        )}

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

      {/* Text sits directly on the page background – no white box */}
      <div className="pt-2.5 flex flex-col flex-1">
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
          <span className="flex items-center gap-0.5 min-w-0 mr-2">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{ad.city}</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {timeAgo(ad.postedAt)}
            </span>
            {ad.views > 0 && (
              <span className="flex items-center gap-0.5">
                <Eye className="w-3 h-3" />
                {ad.views}
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
