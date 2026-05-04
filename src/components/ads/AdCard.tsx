'use client';
import Link from 'next/link';
import { Heart, MapPin, Clock, Eye, Zap } from 'lucide-react';
import { useState } from 'react';
import { Ad } from '@/lib/types';
import { formatPrice, timeAgo, CONDITIONS, CONDITION_COLORS } from '@/lib/data';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';

interface AdCardProps {
  ad: Ad;
  favorited?: boolean;
  onFavoriteToggle?: (id: string, nowFavorited: boolean) => void;
}

export default function AdCard({ ad, favorited = false, onFavoriteToggle }: AdCardProps) {
  const [isFav, setIsFav] = useState(favorited);
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
      onFavoriteToggle?.(ad.id, false);
    } else {
      const { error: insErr } = await supabase.from('favorites').insert({ user_id: user.id, ad_id: ad.id });
      if (insErr && insErr.code !== '23505') { setLoading(false); return; } // 23505 = duplicate, safe to ignore
      setIsFav(true);
      onFavoriteToggle?.(ad.id, true);
    }
    setLoading(false);
  };

  return (
    <Link
      href={`/anunturi/${ad.id}`}
      className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3] bg-slate-100">
        <img
          src={ad.images[0]}
          alt={ad.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badges overlay */}
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

        {/* Favorite button */}
        <button
          onClick={handleFav}
          aria-label={isFav ? 'Elimină din favorite' : 'Adaugă la favorite'}
          className={cn(
            'absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150',
            isFav
              ? 'bg-red-500 text-white shadow-md scale-110'
              : 'bg-white/90 text-slate-400 hover:bg-white hover:text-red-400 shadow',
            loading && 'opacity-50 cursor-wait'
          )}
        >
          <Heart className={cn('w-4 h-4', isFav && 'fill-current')} />
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
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          {ad.title}
        </h3>

        <p className="text-xl font-black text-[#2563EB] mt-0.5">
          {formatPrice(ad.price)}
        </p>

        <div className="mt-auto flex items-center gap-1 pt-2 border-t border-slate-100 text-slate-400 text-xs overflow-hidden">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="shrink-0 truncate max-w-[45%]">{ad.city}</span>
          <span className="flex items-center gap-0.5 min-w-0 flex-1 justify-end">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">{timeAgo(ad.postedAt).replace('Acum ', '')}</span>
          </span>
          <span className="flex items-center gap-0.5 shrink-0">
            <Eye className="w-3 h-3" />
            {ad.views}
          </span>
        </div>
      </div>
    </Link>
  );
}
