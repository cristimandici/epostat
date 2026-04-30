'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Search, ArrowRight, Star, Shield, Zap, TrendingUp,
  Laptop, Car, Home, Shirt, Sofa, Dumbbell, Baby, PawPrint, Wrench, MoreHorizontal,
  ChevronRight, Plus,
} from 'lucide-react';
import AdCard from '@/components/ads/AdCard';
import Button from '@/components/ui/Button';
import { CATEGORIES } from '@/lib/data';
import { Ad } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&auto=format';

function mapAd(row: Record<string, unknown>): Ad {
  return {
    id: row.id as string,
    title: row.title as string,
    price: Number(row.price),
    negotiable: row.negotiable as boolean,
    category: (row.category_id as string) || '',
    condition: row.condition as Ad['condition'],
    description: (row.description as string) || '',
    images: (row.images as string[])?.length ? (row.images as string[]) : [PLACEHOLDER],
    location: (row.location as string) || '',
    city: (row.city as string) || '',
    postedAt: row.created_at as string,
    views: (row.views as number) || 0,
    favorites: (row.favorites_count as number) || 0,
    status: row.status as Ad['status'],
    urgent: (row.urgent as boolean) || false,
    seller: {
      id: (row.seller_id as string) || '',
      name: (row.seller_name as string) || 'Utilizator',
      avatar: row.seller_avatar as string | undefined,
      rating: Number(row.seller_rating) || 5,
      reviewCount: (row.seller_review_count as number) || 0,
      adsCount: 0,
      memberSince: '',
      verified: (row.seller_verified as boolean) || false,
    },
  };
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Laptop: <Laptop className="w-6 h-6" />,
  Car: <Car className="w-6 h-6" />,
  Home: <Home className="w-6 h-6" />,
  Shirt: <Shirt className="w-6 h-6" />,
  Sofa: <Sofa className="w-6 h-6" />,
  Dumbbell: <Dumbbell className="w-6 h-6" />,
  Baby: <Baby className="w-6 h-6" />,
  PawPrint: <PawPrint className="w-6 h-6" />,
  Wrench: <Wrench className="w-6 h-6" />,
  MoreHorizontal: <MoreHorizontal className="w-6 h-6" />,
};

const STATS = [
  { label: 'Anunțuri active', value: '48.000+' },
  { label: 'Utilizatori înregistrați', value: '120.000+' },
  { label: 'Oferte negociate', value: '9.500+' },
  { label: 'Orașe acoperite', value: '250+' },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentAds, setRecentAds] = useState<Ad[]>([]);
  const [nearbyAds, setNearbyAds] = useState<Ad[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadAds() {
      const supabase = createClient();

      const [adsRes, userRes] = await Promise.all([
        supabase.from('ads').select('*').eq('status', 'activ').order('created_at', { ascending: false }).limit(8),
        supabase.auth.getUser(),
      ]);

      const data = adsRes.data;
      if (!data || data.length === 0) return;

      const sellerIds = [...new Set(data.map(r => r.seller_id as string))];
      const { data: profiles } = await supabase
        .from('profiles').select('id, name, avatar_url, rating, review_count, verified').in('id', sellerIds);
      const profMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      const ads = data.map(r => {
        const sp = profMap[r.seller_id as string];
        return mapAd({ ...r, seller_name: sp?.name ?? 'Utilizator', seller_avatar: sp?.avatar_url ?? null, seller_rating: sp?.rating ?? 5, seller_review_count: sp?.review_count ?? 0, seller_verified: sp?.verified ?? false } as Record<string, unknown>);
      });

      setRecentAds(ads);
      setNearbyAds(ads.filter(a => a.city === 'București' || a.city === 'Cluj-Napoca').slice(0, 4));

      const user = userRes.data.user;
      if (user) {
        const { data: favData } = await supabase.from('favorites').select('ad_id').eq('user_id', user.id);
        setFavIds(new Set((favData || []).map(f => f.ad_id as string)));
      }
    }
    loadAds();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1e40af] via-[#2563EB] to-[#7C3AED] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 -left-16 w-80 h-80 rounded-full bg-[#F59E0B]/10 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/90 text-sm font-medium mb-6 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
            Gratuit · Rapid · De încredere
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-5">
            Piața ta online,<br />
            <span className="text-[#F59E0B]">simplă și prietenoasă</span>
          </h1>
          <p className="text-lg text-white/75 mb-10 max-w-xl mx-auto">
            Publică un anunț în 2 minute, negociază direct cu cumpărătorii și vinde mai rapid ca oricând.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = searchQuery
                ? `/anunturi?q=${encodeURIComponent(searchQuery)}`
                : '/anunturi';
            }}
            className="flex max-w-2xl mx-auto gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ce cauți astăzi? ex: bicicletă, telefon, canapea..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-slate-900 text-base shadow-xl focus:outline-none focus:ring-2 focus:ring-[#F59E0B] transition"
                aria-label="Caută anunțuri"
              />
            </div>
            <Button type="submit" variant="accent" size="xl" className="rounded-2xl shrink-0 shadow-xl">
              Caută
            </Button>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['iPhone', 'Bicicletă', 'Laptop', 'Canapea', 'Mașină'].map((q) => (
              <Link
                key={q}
                href={`/anunturi?q=${encodeURIComponent(q)}`}
                className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-sm transition backdrop-blur-sm"
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-black text-[#2563EB]">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-900">Categorii populare</h2>
          <Link href="/anunturi" className="text-sm font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
            Toate categoriile <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/anunturi?cat=${cat.id}`}
              className="group bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col items-center gap-3 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                {CATEGORY_ICONS[cat.icon]}
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-800 text-sm leading-tight">{cat.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{cat.count.toLocaleString('ro-RO')} anunțuri</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent ads */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-900">Anunțuri recente</h2>
          <Link href="/anunturi" className="text-sm font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
            Vezi toate <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recentAds.map((ad) => (
            <AdCard key={ad.id} ad={ad} favorited={favIds.has(ad.id)} />
          ))}
        </div>
      </section>

      {/* Nearby ads */}
      {nearbyAds.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Aproape de tine</h2>
              <p className="text-sm text-slate-500 mt-0.5">Anunțuri din București și Cluj-Napoca</p>
            </div>
            <Link href="/anunturi" className="text-sm font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
              Vezi toate <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {nearbyAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} favorited={favIds.has(ad.id)} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-white border-t border-b border-slate-200 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Cum funcționează?</h2>
          <p className="text-slate-500 mb-10">3 pași simpli pentru a vinde sau cumpăra</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: <Plus className="w-7 h-7 text-[#2563EB]" />, title: 'Postezi anunțul', desc: 'Completezi un formular simplu cu poze și preț. Durează mai puțin de 2 minute.' },
              { icon: <Search className="w-7 h-7 text-[#F59E0B]" />, title: 'Cumpărătorul te găsește', desc: 'Anunțul tău apare instant în căutări. Primești mesaje și oferte direct.' },
              { icon: <TrendingUp className="w-7 h-7 text-green-500" />, title: 'Negociezi și vinzi', desc: 'Accepți oferta potrivită, confirmi tranzacția și gata — e vândut!' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  {icon}
                </div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/cum-functioneaza">
              <Button variant="outline" size="lg">
                Află mai multe <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Shield className="w-6 h-6 text-[#2563EB]" />, title: 'Utilizatori verificați', desc: 'Confirmare prin email și telefon. Badge vizibil pe profil.' },
            { icon: <Star className="w-6 h-6 text-[#F59E0B]" />, title: 'Sistem de recenzii', desc: 'Notează vânzătorii și cumpărătorii după fiecare tranzacție.' },
            { icon: <Zap className="w-6 h-6 text-green-500" />, title: 'Negociere inteligentă', desc: 'Sistem de oferte și contraoferte direct în platformă.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-200/80 p-6 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">{icon}</div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-3xl overflow-hidden p-8 sm:p-12 text-center">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 relative">
            Ai ceva de vândut? Postează acum, gratuit!
          </h2>
          <p className="text-white/70 mb-7 relative">Mii de cumpărători te așteaptă. Anunțul tău poate fi online în 2 minute.</p>
          <Link href="/postare" className="relative">
            <Button variant="accent" size="xl" className="shadow-xl rounded-2xl">
              <Plus className="w-5 h-5" /> Postează anunț gratuit
            </Button>
          </Link>
        </div>
      </section>

      {/* Floating post button – mobile only */}
      <div className="fixed bottom-5 right-5 z-40 sm:hidden">
        <Link href="/postare" aria-label="Postează anunț nou">
          <span className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold px-5 py-3.5 rounded-full shadow-2xl active:scale-95 transition-all">
            <Plus className="w-5 h-5" />
            Anunț nou
          </span>
        </Link>
      </div>
    </div>
  );
}
