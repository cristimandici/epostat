'use client';
import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, ChevronDown, X, Search, LayoutGrid, List } from 'lucide-react';
import AdCard from '@/components/ads/AdCard';
import Button from '@/components/ui/Button';
import { DEMO_ADS, CATEGORIES, CONDITIONS } from '@/lib/data';
import { Ad } from '@/lib/types';
import { cn } from '@/lib/utils';

const CITIES = ['Toate orașele', 'București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Brașov', 'Constanța', 'Sibiu', 'Ilfov'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Cele mai noi' },
  { value: 'price_asc', label: 'Preț crescător' },
  { value: 'price_desc', label: 'Preț descrescător' },
  { value: 'popular', label: 'Cele mai populare' },
];

function ListingsContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialCat = searchParams.get('cat') || '';

  const [query, setQuery] = useState(initialQ);
  const [selectedCat, setSelectedCat] = useState(initialCat);
  const [selectedCity, setSelectedCity] = useState('Toate orașele');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [negotiableOnly, setNegotiableOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleCondition = (c: string) =>
    setSelectedConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const filtered = useMemo<Ad[]>(() => {
    let ads = [...DEMO_ADS];
    if (query) ads = ads.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()) || a.description.toLowerCase().includes(query.toLowerCase()));
    if (selectedCat) ads = ads.filter((a) => a.category.toLowerCase().includes(selectedCat.toLowerCase()));
    if (selectedCity !== 'Toate orașele') ads = ads.filter((a) => a.city === selectedCity);
    if (priceMin) ads = ads.filter((a) => a.price >= parseInt(priceMin));
    if (priceMax) ads = ads.filter((a) => a.price <= parseInt(priceMax));
    if (selectedConditions.length > 0) ads = ads.filter((a) => selectedConditions.includes(a.condition));
    if (negotiableOnly) ads = ads.filter((a) => a.negotiable);

    if (sortBy === 'price_asc') ads.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') ads.sort((a, b) => b.price - a.price);
    else if (sortBy === 'popular') ads.sort((a, b) => b.views - a.views);
    else ads.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

    return ads;
  }, [query, selectedCat, selectedCity, priceMin, priceMax, selectedConditions, negotiableOnly, sortBy]);

  const hasActiveFilters = selectedCat || selectedCity !== 'Toate orașele' || priceMin || priceMax || selectedConditions.length > 0 || negotiableOnly;

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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută în anunțuri..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            aria-label="Sortează după"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Button
            variant={filtersOpen ? 'primary' : 'secondary'}
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="sm:hidden gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filtre
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters – desktop always visible, mobile collapsible */}
        <aside className={cn(
          'w-64 shrink-0 flex-col gap-5',
          filtersOpen ? 'flex' : 'hidden sm:flex'
        )}>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Filtre</h2>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> Resetează
                </button>
              )}
            </div>

            {/* Category */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Categorie</p>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setSelectedCat('')}
                  className={cn('text-left text-sm py-1 px-2 rounded-lg transition', !selectedCat ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50')}
                >
                  Toate categoriile
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={cn('text-left text-sm py-1 px-2 rounded-lg transition', selectedCat === cat.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50')}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* City */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Oraș</p>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Price range */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Interval preț (RON)</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Stare produs</p>
              <div className="flex flex-col gap-1.5">
                {Object.entries(CONDITIONS).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(value)}
                      onChange={() => toggleCondition(value)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Negotiable */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={negotiableOnly}
                onChange={(e) => setNegotiableOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition">Doar negociabile</span>
            </label>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              <span className="font-bold text-slate-900">{filtered.length}</span> anunțuri găsite
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Niciun anunț găsit</h3>
              <p className="text-slate-500 mb-6">Încearcă să modifici filtrele sau termenul de căutare.</p>
              <Button variant="outline" onClick={clearFilters}>Resetează filtrele</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">Se încarcă...</div>}>
      <ListingsContent />
    </Suspense>
  );
}
