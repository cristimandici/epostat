'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Zap, Shield, MessageSquare,
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

function fmtCount(n: number) {
  if (n === 0) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

async function enrichAds(
  supabase: ReturnType<typeof createClient>,
  rawAds: Record<string, unknown>[]
): Promise<Ad[]> {
  if (!rawAds.length) return [];
  const sellerIds = [...new Set(rawAds.map(r => r.seller_id as string))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, rating, review_count, verified')
    .in('id', sellerIds);
  const profMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  return rawAds.map(r => {
    const sp = profMap[r.seller_id as string];
    return mapAd({
      ...r,
      seller_name: sp?.name ?? 'Utilizator',
      seller_avatar: sp?.avatar_url ?? null,
      seller_rating: sp?.rating ?? 5,
      seller_review_count: sp?.review_count ?? 0,
      seller_verified: sp?.verified ?? false,
    });
  });
}

// Horizontal scroll on mobile, responsive grid on desktop
function AdRow({ ads, favIds }: { ads: Ad[]; favIds: Set<string> }) {
  if (ads.length === 0) return null;
  return (
    <div className="-mx-4 sm:mx-0">
      <div className="flex gap-3 overflow-x-auto pb-3 hide-scrollbar px-4 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-5 snap-x snap-mandatory">
        {ads.map(ad => (
          <div key={ad.id} className="shrink-0 w-[46vw] sm:w-auto snap-start">
            <AdCard ad={ad} favorited={favIds.has(ad.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [popularAds, setPopularAds] = useState<Ad[]>([]);
  const [recentlyViewedAds, setRecentlyViewedAds] = useState<Ad[]>([]);
  const [recommendedAds, setRecommendedAds] = useState<Ad[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ ads: 0, users: 0, offers: 0 });

  useEffect(() => {
    async function loadAll() {
      const supabase = createClient();

      const viewedIds = (() => {
        try { return JSON.parse(localStorage.getItem('epostat_viewed') || '[]') as string[]; }
        catch { return [] as string[]; }
      })();

      const [popularRes, recommendedRes, userRes, statsAds, statsUsers, statsOffers] = await Promise.all([
        supabase.from('ads').select('*').eq('status', 'activ')
          .order('favorites_count', { ascending: false })
          .order('views', { ascending: false })
          .limit(10),
        supabase.from('ads').select('*').eq('status', 'activ')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase.auth.getUser(),
        supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'activ'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('offers').select('id', { count: 'exact', head: true }),
      ]);

      setStats({ ads: statsAds.count ?? 0, users: statsUsers.count ?? 0, offers: statsOffers.count ?? 0 });
      setPopularAds(await enrichAds(supabase, (popularRes.data || []) as Record<string, unknown>[]));
      setRecommendedAds(await enrichAds(supabase, (recommendedRes.data || []) as Record<string, unknown>[]));

      if (viewedIds.length > 0) {
        const { data: viewedData } = await supabase
          .from('ads').select('*').in('id', viewedIds).eq('status', 'activ');
        if (viewedData && viewedData.length > 0) {
          const enriched = await enrichAds(supabase, viewedData as Record<string, unknown>[]);
          const byId = Object.fromEntries(enriched.map(a => [a.id, a]));
          setRecentlyViewedAds(viewedIds.filter(id => byId[id]).map(id => byId[id]));
        }
      }

      const user = userRes.data.user;
      if (user) {
        const { data: favData } = await supabase.from('favorites').select('ad_id').eq('user_id', user.id);
        setFavIds(new Set((favData || []).map(f => f.ad_id as string)));
      }
    }
    loadAll();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-[#0F172A] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#2563EB]/8 blur-3xl" />
          <div className="absolute bottom-0 -left-16 w-80 h-80 rounded-full bg-[#2563EB]/5 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-5 backdrop-blur-sm border border-white/10">
            <Zap className="w-3.5 h-3.5 text-[#2563EB]" />
            Gratuit · Rapid · De încredere
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
            Piața ta online,<br />
            <span className="text-[#2563EB]">simplă și prietenoasă</span>
          </h1>
          <p className="text-base text-white/60 max-w-xl mx-auto">
            Publică un anunț în 2 minute, negociază direct cu cumpărătorii și vinde mai rapid ca oricând.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-slate-900">Categorii</h2>
          <Link href="/anunturi" className="text-sm font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
            Toate <ChevronRight className="w-4 h-4" />
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

      {/* Popular / In tendinta */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">În tendință</h2>
            <p className="text-sm text-slate-400 mt-0.5">Cele mai apreciate anunțuri chiar acum</p>
          </div>
          <Link href="/anunturi?sort=popular" className="hidden sm:block">
            <Button variant="outline" size="sm" className="gap-1">
              Vezi mai multe <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <AdRow ads={popularAds} favIds={favIds} />
        <div className="mt-4 sm:hidden text-center">
          <Link href="/anunturi?sort=popular" className="text-sm font-semibold text-[#2563EB] flex items-center justify-center gap-1">
            Vezi mai multe <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Recently viewed – only shown after user has browsed ads */}
      {recentlyViewedAds.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Văzute recent</h2>
              <p className="text-sm text-slate-400 mt-0.5">Continuă de unde ai rămas</p>
            </div>
          </div>
          <AdRow ads={recentlyViewedAds} favIds={favIds} />
        </section>
      )}

      {/* De ce epostat — stats + trust features */}
      <section className="bg-white border-t border-b border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8 text-center">
            {[
              { label: 'Anunțuri active', value: fmtCount(stats.ads) },
              { label: 'Utilizatori', value: fmtCount(stats.users) },
              { label: 'Oferte trimise', value: fmtCount(stats.offers) },
              { label: 'Orașe acoperite', value: '300+' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-3xl font-black text-slate-900">{value}</p>
                <p className="text-sm text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Zap className="w-5 h-5 text-[#2563EB]" />,
                title: '100% Gratuit',
                desc: 'Postezi oricâte anunțuri fără costuri. Nicio taxă ascunsă.',
              },
              {
                icon: <Shield className="w-5 h-5 text-[#2563EB]" />,
                title: 'Utilizatori verificați',
                desc: 'Confirmare prin email și badge de verificare vizibil pe orice profil.',
              },
              {
                icon: <MessageSquare className="w-5 h-5 text-green-500" />,
                title: 'Negociere directă',
                desc: 'Sistem de oferte și contraoferte integrat. Fără intermediari.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-slate-50 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recomandate pentru tine */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">Recomandate pentru tine</h2>
            <p className="text-sm text-slate-400 mt-0.5">Anunțuri noi adăugate recent</p>
          </div>
          <Link href="/anunturi" className="text-sm font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
            Toate anunțurile <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {recommendedAds.map((ad) => (
            <AdCard key={ad.id} ad={ad} favorited={favIds.has(ad.id)} />
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative bg-[#0F172A] rounded-3xl overflow-hidden p-8 sm:p-12 text-center">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 relative">
            Ai ceva de vândut? Postează acum, gratuit!
          </h2>
          <p className="text-white/70 mb-7 relative">
            Mii de cumpărători te așteaptă. Anunțul tău poate fi online în 2 minute.
          </p>
          <Link href="/postare" className="relative">
            <Button variant="secondary" size="xl" className="shadow-xl rounded-2xl">
              <Plus className="w-5 h-5" /> Postează anunț gratuit
            </Button>
          </Link>
        </div>
      </section>

      {/* Floating post button – mobile only */}
      <div className="fixed bottom-5 right-5 z-40 sm:hidden">
        <Link href="/postare" aria-label="Postează anunț nou">
          <span className="flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold px-5 py-3.5 rounded-full shadow-2xl active:scale-95 transition-all">
            <Plus className="w-5 h-5" />
            Anunț nou
          </span>
        </Link>
      </div>
    </div>
  );
}
