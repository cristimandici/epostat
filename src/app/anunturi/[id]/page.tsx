'use client';
import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart, Share2, MapPin, Clock, Eye, Star, ShieldCheck,
  MessageCircle, TrendingDown, ChevronLeft,
  ChevronRight, Phone, Flag, Zap, BadgeCheck, X,
} from 'lucide-react';
import { formatPrice, timeAgo, CONDITIONS, CONDITION_COLORS } from '@/lib/data';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import OfferModal from '@/components/offers/OfferModal';
import ToastContainer from '@/components/ui/Toast';
import AdCard from '@/components/ads/AdCard';
import { Toast, Ad } from '@/lib/types';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format';

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
      phone: row.seller_phone as string | undefined,
    },
  };
}

export default function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [ad, setAd] = useState<Ad | null>(null);
  const [related, setRelated] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [offerOpen, setOfferOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'success') =>
    setToasts(p => [...p, { id: Date.now().toString(), message, type }]);
  const removeToast = (id: string) => setToasts(p => p.filter(t => t.id !== id));

  useEffect(() => {
    async function load() {
      // Fetch the ad directly from the ads table
      const { data: adRow, error: adErr } = await supabase
        .from('ads')
        .select('*')
        .eq('id', id)
        .single();

      if (adErr || !adRow) { setLoading(false); return; }

      // Fetch seller profile separately
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, phone, rating, review_count, verified')
        .eq('id', adRow.seller_id)
        .single();

      const combined = {
        ...adRow,
        seller_id: adRow.seller_id,
        seller_name: profileRow?.name ?? 'Utilizator',
        seller_avatar: profileRow?.avatar_url ?? null,
        seller_phone: profileRow?.phone ?? null,
        seller_rating: profileRow?.rating ?? 5,
        seller_review_count: profileRow?.review_count ?? 0,
        seller_verified: profileRow?.verified ?? false,
      };

      const mapped = mapAd(combined as Record<string, unknown>);
      setAd(mapped);

      // Increment views atomically (RPC excludes seller's own views)
      supabase.rpc('increment_ad_views', { p_ad_id: id });

      // Check if current user has this ad favorited
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: favRows } = await supabase
          .from('favorites')
          .select('ad_id')
          .eq('user_id', user.id)
          .eq('ad_id', id)
          .limit(1);
        if (favRows && favRows.length > 0) setIsFav(true);
      }

      // Load related ads
      const { data: relData } = await supabase
        .from('ads')
        .select('*')
        .eq('category_id', adRow.category_id)
        .eq('status', 'activ')
        .neq('id', id)
        .limit(4);

      if (relData && relData.length > 0) {
        const sellerIds = [...new Set(relData.map(r => r.seller_id as string))];
        const { data: relProfiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, rating, review_count, verified')
          .in('id', sellerIds);
        const profMap = Object.fromEntries((relProfiles || []).map(p => [p.id, p]));
        setRelated(relData.map(r => {
          const sp = profMap[r.seller_id as string];
          return mapAd({
            ...r,
            seller_id: r.seller_id,
            seller_name: sp?.name ?? 'Utilizator',
            seller_avatar: sp?.avatar_url ?? null,
            seller_rating: sp?.rating ?? 5,
            seller_review_count: sp?.review_count ?? 0,
            seller_verified: sp?.verified ?? false,
          } as Record<string, unknown>);
        }));
      }

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-black text-slate-900 mb-3">Anunțul nu a fost găsit</h1>
        <p className="text-slate-500 mb-8">Poate a fost șters sau expirat.</p>
        <Button onClick={() => router.push('/anunturi')}>
          <ChevronLeft className="w-4 h-4" /> Înapoi la anunțuri
        </Button>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition">Acasă</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/anunturi" className="hover:text-blue-600 transition">Anunțuri</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/anunturi?cat=${ad.category}`} className="hover:text-blue-600 transition">{ad.category}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800 font-medium line-clamp-1 max-w-[200px]">{ad.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 pb-24 lg:pb-0">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            {/* Gallery */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden">
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={ad.images[currentImg]}
                  alt={`${ad.title} – fotografie ${currentImg + 1}`}
                  className="w-full h-full object-contain"
                />
                {ad.images.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImg(p => (p - 1 + ad.images.length) % ad.images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-slate-700 transition">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setCurrentImg(p => (p + 1) % ad.images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-slate-700 transition">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {ad.images.map((_, i) => (
                        <button key={i} onClick={() => setCurrentImg(i)}
                          className={cn('w-2 h-2 rounded-full transition-all', i === currentImg ? 'bg-white scale-125' : 'bg-white/50')} />
                      ))}
                    </div>
                  </>
                )}
                {ad.urgent && (
                  <div className="absolute top-3 left-3">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                      <Zap className="w-3 h-3" /> Urgent
                    </span>
                  </div>
                )}
              </div>
              {ad.images.length > 1 && (
                <div className="flex gap-2 p-3 border-t border-slate-100">
                  {ad.images.map((img, i) => (
                    <button key={i} onClick={() => setCurrentImg(i)}
                      className={cn('w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0', i === currentImg ? 'border-blue-500' : 'border-transparent hover:border-slate-300')}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6">
              <h2 className="font-bold text-slate-900 mb-3">Descriere</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{ad.description}</p>
            </div>

            {/* Location */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6">
              <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Locație
              </h2>
              <p className="text-slate-700 font-medium">{ad.city}{ad.location ? `, ${ad.location}` : ''}</p>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <div className="sticky top-20">
              {/* Price card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                {ad.status === 'vandut' && (
                  <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200">
                    <BadgeCheck className="w-5 h-5 text-slate-500 shrink-0" />
                    <div>
                      <p className="font-black text-slate-700 text-sm">Acest anunț a fost vândut</p>
                      <p className="text-xs text-slate-400 mt-0.5">Produsul nu mai este disponibil pentru cumpărare.</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {ad.status === 'vandut' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">Vândut</span>
                  ) : (
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', CONDITION_COLORS[ad.condition])}>
                      {CONDITIONS[ad.condition]}
                    </span>
                  )}
                  {ad.negotiable && ad.status !== 'vandut' && <Badge variant="info">Negociabil</Badge>}
                  {ad.urgent && ad.status !== 'vandut' && <Badge variant="danger">Urgent</Badge>}
                </div>

                <h1 className="text-xl font-black text-slate-900 leading-tight mb-4">{ad.title}</h1>

                <div className="mb-6">
                  <p className={cn('text-4xl font-black', ad.status === 'vandut' ? 'text-slate-400 line-through' : 'text-[#2563EB]')}>
                    {formatPrice(ad.price)}
                  </p>
                  {ad.negotiable && ad.status !== 'vandut' && (
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> Prețul e negociabil
                    </p>
                  )}
                </div>

                {ad.status !== 'vandut' && (
                  <div className="flex flex-col gap-3">
                    {ad.negotiable && (
                      <Button variant="outline" size="lg" fullWidth className="gap-2" onClick={() => {
                        if (!currentUserId) { addToast('Trebuie să fii autentificat pentru a face o ofertă.', 'error'); return; }
                        if (currentUserId === ad.seller.id) { addToast('Nu poți trimite o ofertă la propriul anunț.', 'info'); return; }
                        setOfferOpen(true);
                      }}>
                        <TrendingDown className="w-5 h-5" /> Fă o ofertă
                      </Button>
                    )}
                    <Button variant="secondary" size="lg" fullWidth className="gap-2"
                      onClick={async () => {
                        if (!currentUserId) { addToast('Trebuie să fii autentificat pentru a trimite mesaje.', 'error'); return; }
                        if (currentUserId === ad.seller.id) { addToast('Nu poți trimite mesaj propriului anunț.', 'info'); return; }
                        const { data: convId, error } = await supabase.rpc('start_conversation', { p_ad_id: id });
                        if (error || !convId) { addToast('Eroare la deschiderea conversației.', 'error'); return; }
                        router.push(`/mesaje?conv=${convId}`);
                      }}>
                      <MessageCircle className="w-5 h-5" /> Trimite mesaj
                    </Button>
                  </div>
                )}

                <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {timeAgo(ad.postedAt)}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {ad.views} vizualizări</span>
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {ad.favorites} favorite</span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    disabled={favLoading}
                    onClick={async () => {
                      if (!currentUserId) { addToast('Trebuie să fii autentificat pentru a salva favorite.', 'error'); return; }
                      setFavLoading(true);
                      if (isFav) {
                        const { error } = await supabase.from('favorites').delete().eq('user_id', currentUserId).eq('ad_id', id);
                        if (error) { addToast('Eroare: ' + error.message, 'error'); }
                        else { setIsFav(false); addToast('Eliminat din favorite', 'info'); }
                      } else {
                        const { error } = await supabase.from('favorites').insert({ user_id: currentUserId, ad_id: id });
                        if (error && error.code !== '23505') { addToast('Eroare: ' + error.message, 'error'); }
                        else { setIsFav(true); addToast('Salvat la favorite!', 'success'); }
                      }
                      setFavLoading(false);
                    }}
                    className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition disabled:opacity-50',
                      isFav ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-500')}>
                    <Heart className={cn('w-4 h-4', isFav && 'fill-current')} />
                    {isFav ? 'Salvat' : 'Salvează'}
                  </button>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(window.location.href); addToast('Link copiat!', 'success'); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                    <Share2 className="w-4 h-4" /> Distribuie
                  </button>
                  <button onClick={() => setReportOpen(true)} className="px-3 py-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition" title="Raportează anunțul">
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Seller card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    {ad.seller.avatar ? (
                      <img src={ad.seller.avatar} alt={ad.seller.name}
                        className="w-12 h-12 rounded-full border-2 border-slate-200 object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black">
                        {ad.seller.name[0]?.toUpperCase()}
                      </div>
                    )}
                    {ad.seller.verified && (
                      <BadgeCheck className="absolute -bottom-0.5 -right-0.5 w-5 h-5 text-blue-500 fill-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{ad.seller.name}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span>{Number(ad.seller.rating).toFixed(1)}</span>
                      <span>· {ad.seller.reviewCount} recenzii</span>
                    </div>
                  </div>
                  {ad.seller.verified && (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Verificat
                    </span>
                  )}
                </div>

                {ad.seller.phone ? (
                  <a href={`tel:${ad.seller.phone}`}>
                    <Button variant="secondary" fullWidth size="sm" className="gap-2">
                      <Phone className="w-4 h-4" /> {ad.seller.phone}
                    </Button>
                  </a>
                ) : (
                  <Button variant="secondary" fullWidth size="sm" className="gap-2"
                    onClick={() => addToast('Vânzătorul nu a adăugat un număr de telefon.', 'info')}>
                    <Phone className="w-4 h-4" /> Afișează numărul
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related ads */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-black text-slate-900 mb-5">Anunțuri similare</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map(a => <AdCard key={a.id} ad={a} />)}
            </div>
          </section>
        )}
      </div>

      {/* Mobile sticky action bar */}
      {ad.status !== 'vandut' && currentUserId !== ad.seller.id && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 flex gap-3 px-4 pt-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          {ad.negotiable && (
            <Button variant="outline" size="md" fullWidth className="gap-2" onClick={() => setOfferOpen(true)}>
              <TrendingDown className="w-4 h-4" /> Fă o ofertă
            </Button>
          )}
          <Button variant="secondary" size="md" fullWidth className="gap-2"
            onClick={async () => {
              if (!currentUserId) { addToast('Trebuie să fii autentificat.', 'error'); return; }
              const { data: convId, error } = await supabase.rpc('start_conversation', { p_ad_id: id });
              if (error || !convId) { addToast('Eroare la deschiderea conversației.', 'error'); return; }
              router.push(`/mesaje?conv=${convId}`);
            }}>
            <MessageCircle className="w-4 h-4" /> Trimite mesaj
          </Button>
        </div>
      )}

      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setReportOpen(false); setReportReason(''); }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Raportează anunțul</h3>
              <button onClick={() => { setReportOpen(false); setReportReason(''); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Selectează motivul raportării:</p>
            <div className="flex flex-col gap-2 mb-5">
              {['Produs fals / înșelătorie', 'Preț incorect / spam', 'Conținut inadecvat', 'Anunț duplicat', 'Altele'].map(reason => (
                <button key={reason} onClick={() => setReportReason(reason)}
                  className={cn('px-4 py-2.5 rounded-xl border text-sm text-left transition',
                    reportReason === reason
                      ? 'border-red-300 bg-red-50 text-red-600 font-medium'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50')}>
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setReportOpen(false); setReportReason(''); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                Anulează
              </button>
              <button
                disabled={!reportReason || reportSubmitting}
                onClick={async () => {
                  if (!currentUserId) { addToast('Trebuie să fii autentificat.', 'error'); setReportOpen(false); return; }
                  setReportSubmitting(true);
                  await supabase.rpc('report_ad', { p_ad_id: id, p_reason: reportReason });
                  setReportSubmitting(false);
                  setReportOpen(false);
                  setReportReason('');
                  addToast('Raportul a fost trimis. Mulțumim!', 'success');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-40 transition">
                {reportSubmitting ? '...' : 'Raportează'}
              </button>
            </div>
          </div>
        </div>
      )}

      <OfferModal
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        adTitle={ad.title}
        askingPrice={ad.price}
        onSubmit={async (amount, message) => {
          if (!currentUserId || !ad) { addToast('Trebuie să fii autentificat.', 'error'); return; }
          if (currentUserId === ad.seller.id) { addToast('Nu poți face ofertă la propriul anunț.', 'info'); return; }
          const { data: convId, error: convErr } = await supabase.rpc('start_conversation', { p_ad_id: id });
          if (convErr || !convId) { addToast('Eroare la deschiderea conversației.', 'error'); return; }
          const { error: msgErr } = await supabase.rpc('send_message', {
            p_conversation_id: convId,
            p_text: String(amount),
            p_type: 'offer',
            p_media_url: null,
          });
          if (msgErr) { addToast('Eroare la trimiterea ofertei.', 'error'); return; }
          if (message?.trim()) {
            await supabase.rpc('send_message', {
              p_conversation_id: convId,
              p_text: message.trim(),
              p_type: 'text',
              p_media_url: null,
            });
          }
          setOfferOpen(false);
          router.push(`/mesaje?conv=${convId}`);
        }}
      />
    </>
  );
}
