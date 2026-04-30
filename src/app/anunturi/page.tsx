'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import AdCard from '@/components/ads/AdCard';
import Button from '@/components/ui/Button';
import { CATEGORIES, CONDITIONS } from '@/lib/data';
import { Ad } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const CITIES = ['Toate orașele', 'Alba Iulia', 'Alexandria', 'Arad', 'Bacău', 'Baia Mare', 'Bistrița', 'Botoșani', 'Brăila', 'Brașov', 'București', 'Buzău', 'Călărași', 'Cluj-Napoca', 'Constanța', 'Craiova', 'Deva', 'Drobeta-Turnu Severin', 'Dej', 'Focșani', 'Galați', 'Giurgiu', 'Iași', 'Miercurea Ciuc', 'Oradea', 'Piatra Neamț', 'Pitești', 'Ploiești', 'Râmnicu Vâlcea', 'Reșița', 'Satu Mare', 'Sfântu Gheorghe', 'Sibiu', 'Slatina', 'Slobozia', 'Suceava', 'Târgu Jiu', 'Târgu Mureș', 'Târgoviște', 'Timișoara', 'Tulcea', 'Vaslui', 'Zalău', 'Ilfov'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Cele mai noi' },
  { value: 'price_asc', label: 'Preț crescător' },
  { value: 'price_desc', label: 'Preț descrescător' },
  { value: 'popular', label: 'Cele mai populare' },
];
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

function ListingsContent() {
  const searchParams = useSearchParams();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCat, setSelectedCat] = useState(searchParams.get('cat') || '');
  const [selectedCity, setSelectedCity] = useState('Toate orașele');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [negotiableOnly, setNegotiableOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    async function loadFavs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('favorites').select('ad_id').eq('user_id', user.id);
      setFavIds(new Set((data || []).map(f => f.ad_id as string)));
    }
    loadFavs();
  }, []);

  const fetchAds = useCallback(async () => {
    setLoading(true);

    let q = supabase.from('ads_with_seller').select('*').eq('status', 'activ');

    if (selectedCat) q = q.eq('category_id', selectedCat);
    if (selectedCity !== 'Toate orașele') q = q.eq('city', selectedCity);
    if (priceMin) q = q.gte('price', Number(priceMin));
    if (priceMax) q = q.lte('price', Number(priceMax));
    if (selectedConditions.length > 0) q = q.in('condition', selectedConditions);
    if (negotiableOnly) q = q.eq('negotiable', true);
    if (query.trim()) q = q.ilike('title', `%${query.trim()}%`);

    if (sortBy === 'price_asc') q = q.order('price', { ascending: true });
    else if (sortBy === 'price_desc') q = q.order('price', { ascending: false });
    else if (sortBy === 'popular') q = q.order('views', { ascending: false });
    else q = q.order('created_at', { ascending: false });

    const { data } = await q.limit(60);
    setAds((data || []).map(r => mapAd(r as Record<string, unknown>)));
    setLoading(false);
  }, [query, selectedCat, selectedCity, priceMin, priceMax, selectedConditions, negotiableOnly, sortBy]);

  useEffect(() => {
    const t = setTimeout(fetchAds, query ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchAds]);

  const toggleCondition = (c: string) =>
    setSelectedConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const hasFilters = selectedCat || selectedCity !== 'Toate orașele' || priceMin || priceMax || selectedConditions.length > 0 || negotiableOnly;

  const clearFilters = () => {
    setQuery('');
    setSelectedCat('');
    setSelectedCity('Toate orașele');
    setPriceMin('');
    setPriceMax('');
    setSelectedConditions([]);
    setNegotiableOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Caută în anunțuri..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <div className="flex gap-2">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Button variant={filtersOpen ? 'primary' : 'secondary'} onClick={() => setFiltersOpen(!filtersOpen)} className="sm:hidden gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Filtre
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className={cn('w-64 shrink-0 flex-col gap-5', filtersOpen ? 'flex' : 'hidden sm:flex')}>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Filtre</h2>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> Resetează
                </button>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Categorie</p>
              <div className="flex flex-col gap-1">
                <button onClick={() => setSelectedCat('')}
                  className={cn('text-left text-sm py-1 px-2 rounded-lg transition', !selectedCat ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50')}>
                  Toate categoriile
                </button>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                    className={cn('text-left text-sm py-1 px-2 rounded-lg transition', selectedCat === cat.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50')}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Oraș</p>
              <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Interval preț (RON)</p>
              <div className="flex gap-2">
                <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="Min"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Max"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Stare produs</p>
              <div className="flex flex-col gap-1.5">
                {Object.entries(CONDITIONS).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={selectedConditions.includes(value)} onChange={() => toggleCondition(value)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={negotiableOnly} onChange={e => setNegotiableOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition">Doar negociabile</span>
            </label>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              {loading ? 'Se caută...' : <><span className="font-bold text-slate-900">{ads.length}</span> anunțuri găsite</>}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-slate-200" />
                  <div className="p-3 flex flex-col gap-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-6 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : ads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Niciun anunț găsit</h3>
              <p className="text-slate-500 mb-6">Încearcă să modifici filtrele sau termenul de căutare.</p>
              <Button variant="outline" onClick={clearFilters}>Resetează filtrele</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {ads.map(ad => <AdCard key={ad.id} ad={ad} favorited={favIds.has(ad.id)} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
