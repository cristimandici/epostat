'use client';
import Link from 'next/link';
import { Heart, MapPin, Clock, Eye, Zap } from 'lucide-react';
import { useState } from 'react';
import { Ad } from '@/lib/types';
import { formatPrice, timeAgo, CONDITIONS, CONDITION_COLORS } from '@/lib/data';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

interface AdCardProps {
  ad: Ad;
  onFavorite?: (id: string) => void;
  favorited?: boolean;
}

export default function AdCard({ ad, onFavorite, favorited = false }: AdCardProps) {
  const [isFav, setIsFav] = useState(favorited);

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFav(!isFav);
    onFavorite?.(ad.id);
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
              : 'bg-white/90 text-slate-400 hover:bg-white hover:text-red-400 shadow'
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

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
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
