'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck, Star, Edit3, Settings, Package, TrendingDown,
  MessageCircle, Clock, Eye, Heart, ChevronRight, Plus, ShieldCheck,
  Phone, Mail,
} from 'lucide-react';
import AdCard from '@/components/ads/AdCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { DEMO_ADS, DEMO_USERS, DEMO_OFFERS, formatPrice, timeAgo } from '@/lib/data';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'active', label: 'Active', icon: <Package className="w-4 h-4" /> },
  { id: 'offers', label: 'Oferte', icon: <TrendingDown className="w-4 h-4" /> },
  { id: 'favorites', label: 'Favorite', icon: <Heart className="w-4 h-4" /> },
  { id: 'sold', label: 'Vândute', icon: <BadgeCheck className="w-4 h-4" /> },
];

const ME = DEMO_USERS[0];

const OFFER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  asteptare: { label: 'În așteptare', color: 'bg-yellow-100 text-yellow-700' },
  acceptata: { label: 'Acceptată', color: 'bg-green-100 text-green-700' },
  refuzata: { label: 'Refuzată', color: 'bg-red-100 text-red-700' },
  contraoferta: { label: 'Contraofertă primită', color: 'bg-blue-100 text-blue-700' },
};

export default function ProfilePage() {
  const [tab, setTab] = useState('active');
  const myAds = DEMO_ADS.filter((a) => a.seller.id === ME.id);
  const favoriteAds = DEMO_ADS.slice(2, 5);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <div className="relative">
            <img
              src={ME.avatar || ''}
              alt={ME.name}
              className="w-20 h-20 rounded-2xl border-2 border-slate-200"
            />
            {ME.verified && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow">
                <BadgeCheck className="w-5 h-5 text-blue-500" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900">{ME.name}</h1>
              {ME.verified && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verificat
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-0.5">Membru din {ME.memberSince}</p>

            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                <span className="font-bold text-slate-900">{ME.rating}</span>
                <span className="text-slate-500">({ME.reviewCount} recenzii)</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Package className="w-4 h-4 text-slate-400" />
                <span>{ME.adsCount} anunțuri publicate</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Edit3 className="w-4 h-4" /> Editează profil
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Verification status */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: <Mail className="w-4 h-4" />, label: 'Email verificat', done: true },
            { icon: <Phone className="w-4 h-4" />, label: 'Telefon verificat', done: ME.verified },
            { icon: <ShieldCheck className="w-4 h-4" />, label: 'Identitate verificată', done: ME.verified },
          ].map(({ icon, label, done }) => (
            <div key={label} className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-sm', done ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-500')}>
              {icon}
              <span className="font-medium">{label}</span>
              {done ? <BadgeCheck className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 mb-4 p-1.5 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all',
              tab === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Active ads */}
      {tab === 'active' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-500"><strong className="text-slate-900">{myAds.length}</strong> anunțuri active</p>
            <Link href="/postare">
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Anunț nou
              </Button>
            </Link>
          </div>
          {myAds.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {myAds.map((ad) => <AdCard key={ad.id} ad={ad} />)}
            </div>
          ) : (
            <EmptyState
              emoji="📦"
              title="Nu ai încă niciun anunț activ"
              desc="Postează primul tău anunț gratuit și ajunge la mii de cumpărători!"
              cta="Postează primul anunț"
              href="/postare"
            />
          )}
        </div>
      )}

      {/* Tab: Offers */}
      {tab === 'offers' && (
        <div className="flex flex-col gap-3">
          {DEMO_OFFERS.length > 0 ? DEMO_OFFERS.map((offer) => {
            const status = OFFER_STATUS_LABELS[offer.status];
            return (
              <div key={offer.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 flex gap-4">
                <img src={offer.adImage} alt={offer.adTitle} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm line-clamp-1">{offer.adTitle}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{timeAgo(offer.createdAt)}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-lg font-black text-[#2563EB]">{formatPrice(offer.currentAmount)}</span>
                    <span className="text-xs text-slate-400 line-through">{formatPrice(offer.originalPrice)}</span>
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', status.color)}>{status.label}</span>
                  </div>
                </div>
                <Link href="/oferte" className="shrink-0 self-center">
                  <Button variant="outline" size="sm">Detalii</Button>
                </Link>
              </div>
            );
          }) : (
            <EmptyState
              emoji="💬"
              title="Nicio ofertă trimisă"
              desc="Când faci o ofertă pentru un anunț, o vei vedea aici."
              cta="Caută anunțuri"
              href="/anunturi"
            />
          )}
        </div>
      )}

      {/* Tab: Favorites */}
      {tab === 'favorites' && (
        <div>
          {favoriteAds.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {favoriteAds.map((ad) => <AdCard key={ad.id} ad={ad} favorited />)}
            </div>
          ) : (
            <EmptyState
              emoji="❤️"
              title="Nu ai anunțuri favorite"
              desc="Salvează anunțuri apăsând pe inimioara din fiecare card."
              cta="Explorează anunțuri"
              href="/anunturi"
            />
          )}
        </div>
      )}

      {/* Tab: Sold */}
      {tab === 'sold' && (
        <EmptyState
          emoji="🎉"
          title="Niciun produs vândut încă"
          desc="Anunțurile marcate ca vândute vor apărea aici."
          cta="Postează un anunț"
          href="/postare"
        />
      )}
    </div>
  );
}

function EmptyState({ emoji, title, desc, cta, href }: { emoji: string; title: string; desc: string; cta: string; href: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">{desc}</p>
      <Link href={href}>
        <Button variant="primary">{cta}</Button>
      </Link>
    </div>
  );
}
