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
      className="group bg-white rounded-xl overflow-hidden border border-transparent hover:border-zinc-300 transition-all duration-150 flex flex-col"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3] bg-zinc-100">
        <img
          src={ad.images[0]}
          alt={ad.title}
          className="w-full h-full object-cover transition-transform duration-300"
          loading="lazy"
        />

        {/* Condition / urgent badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {ad.urgent && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold shadow">
              <Zap className="w-3 h-3" /> Urgent
            </span>
          )}
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold shadow', CONDITION_COLORS[ad.condition])}>
            {CONDITIONS[ad.condition]}
          </span>
        </div>

        {/* Favorite pill – bottom right, Buycycle style */}
        <button
          onClick={handleFav}
          aria-label={isFav ? 'Elimină din favorite' : 'Adaugă la favorite'}
          className={cn(
            'absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white shadow transition-all duration-150',
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

        {ad.negotiable && (
          <div className="absolute bottom-2 left-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow">
              Negociabil
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 transition-colors">
          {ad.title}
        </h3>

        <p className="text-base font-semibold text-slate-900 mt-0.5">
          {formatPrice(ad.price)}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[100px]">{ad.city}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {timeAgo(ad.postedAt)}
            </span>
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {ad.views}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
