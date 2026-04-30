'use client';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, BadgeCheck, ShieldCheck, Package, MapPin, ChevronLeft } from 'lucide-react';
import AdCard from '@/components/ads/AdCard';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { timeAgo } from '@/lib/data';
import { Ad } from '@/lib/types';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&auto=format';

function mapAd(row: Record<string, unknown>, profile: Record<string, unknown>): Ad {
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
      id: row.seller_id as string,
      name: (profile.name as string) || 'Utilizator',
      avatar: (profile.avatar_url as string) || undefined,
      rating: Number(profile.rating) || 5,
      reviewCount: (profile.review_count as number) || 0,
      adsCount: 0,
      memberSince: '',
      verified: (profile.verified as boolean) || false,
    },
  };
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // Redirect to own profile if viewing self
      if (user && user.id === id) { router.replace('/profil'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, city, rating, review_count, verified')
        .eq('id', id)
        .single();

      if (!prof) { setLoading(false); return; }
      setProfile(prof as Record<string, unknown>);

      const { data: adsData } = await supabase
        .from('ads')
        .select('*')
        .eq('seller_id', id)
        .eq('status', 'activ')
        .order('created_at', { ascending: false });

      setAds((adsData || []).map(a => mapAd(a as Record<string, unknown>, prof as Record<string, unknown>)));
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-black text-slate-900 mb-3">Profil negăsit</h1>
        <p className="text-slate-500 mb-8">Acest utilizator nu există sau a fost șters.</p>
        <Button onClick={() => router.push('/anunturi')}>
          <ChevronLeft className="w-4 h-4" /> Înapoi la anunțuri
        </Button>
      </div>
    );
  }

  const name = profile.name as string;
  const avatar = profile.avatar_url as string | null;
  const city = profile.city as string | null;
  const rating = Number(profile.rating) || 5;
  const reviewCount = (profile.review_count as number) || 0;
  const verified = (profile.verified as boolean) || false;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-6">
        <ChevronLeft className="w-4 h-4" /> Înapoi
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <div className="relative shrink-0">
            {avatar ? (
              <img src={avatar} alt={name} className="w-20 h-20 rounded-2xl border-2 border-slate-200 object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black">
                {name[0]?.toUpperCase()}
              </div>
            )}
            {verified && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow">
                <BadgeCheck className="w-5 h-5 text-blue-500" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900">{name}</h1>
              {verified && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verificat
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>
                <span className="text-slate-500">({reviewCount} recenzii)</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Package className="w-4 h-4 text-slate-400" />
                <span>{ads.length} anunțuri active</span>
              </div>
              {city && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{city}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ads */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-slate-900">Anunțurile lui {name.split(' ')[0]}</h2>
        <span className="text-sm text-slate-500">{ads.length} active</span>
      </div>

      {ads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-lg font-bold text-slate-900 mb-2">Niciun anunț activ</p>
          <p className="text-slate-500 text-sm">Acest utilizator nu are anunțuri active momentan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {ads.map(ad => <AdCard key={ad.id} ad={ad} />)}
        </div>
      )}
    </div>
  );
}
