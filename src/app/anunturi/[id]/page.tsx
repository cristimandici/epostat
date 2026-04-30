'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart, Share2, MapPin, Clock, Eye, Star, ShieldCheck,
  MessageCircle, TrendingDown, ShoppingBag, ChevronLeft,
  ChevronRight, Phone, Flag, Zap, BadgeCheck,
} from 'lucide-react';
import { DEMO_ADS, formatPrice, timeAgo, CONDITIONS, CONDITION_COLORS } from '@/lib/data';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import OfferModal from '@/components/offers/OfferModal';
import ToastContainer from '@/components/ui/Toast';
import AdCard from '@/components/ads/AdCard';
import { Toast } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const ad = DEMO_ADS.find((a) => a.id === id);

  const [currentImg, setCurrentImg] = useState(0);
  const [offerOpen, setOfferOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'success') =>
    setToasts((prev) => [...prev, { id: Date.now().toString(), message, type }]);
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

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

  const relatedAds = DEMO_ADS.filter((a) => a.id !== id && a.category === ad.category).slice(0, 4);

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-blue-600 transition">Acasă</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/anunturi" className="hover:text-blue-600 transition">Anunțuri</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/anunturi?cat=${ad.category.toLowerCase()}`} className="hover:text-blue-600 transition">{ad.category}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800 font-medium line-clamp-1 max-w-[200px]">{ad.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
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
                    <button
                      onClick={() => setCurrentImg((p) => (p - 1 + ad.images.length) % ad.images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-slate-700 transition"
                      aria-label="Fotografie anterioară"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImg((p) => (p + 1) % ad.images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-slate-700 transition"
                      aria-label="Fotografie următoare"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {ad.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImg(i)}
                          className={cn('w-2 h-2 rounded-full transition-all', i === currentImg ? 'bg-white scale-125' : 'bg-white/50')}
                          aria-label={`Fotografie ${i + 1}`}
                        />
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
              {/* Thumbnail strip */}
              {ad.images.length > 1 && (
                <div className="flex gap-2 p-3 border-t border-slate-100">
                  {ad.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImg(i)}
                      className={cn('w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0', i === currentImg ? 'border-blue-500' : 'border-transparent hover:border-slate-300')}
                    >
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

            {/* Specs */}
            {ad.specs && Object.keys(ad.specs).length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6">
                <h2 className="font-bold text-slate-900 mb-4">Specificații</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(ad.specs).map(([key, val]) => (
                    <div key={key} className="flex items-start gap-2 py-2.5 border-b border-slate-100 last:border-0">
                      <dt className="text-sm text-slate-500 min-w-[120px]">{key}</dt>
                      <dd className="text-sm font-semibold text-slate-800">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6">
              <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Locație
              </h2>
              <p className="text-slate-700 font-medium">{ad.location}</p>
              <div className="mt-3 bg-slate-100 rounded-xl h-40 flex items-center justify-center text-slate-400 text-sm">
                Hartă indisponibilă în modul demo
              </div>
            </div>
          </div>

          {/* Right column – sticky panel */}
          <div className="flex flex-col gap-4">
            <div className="sticky top-20">
              {/* Price card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                {/* Badges row */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', CONDITION_COLORS[ad.condition])}>
                    {CONDITIONS[ad.condition]}
                  </span>
                  {ad.negotiable && <Badge variant="info">Negociabil</Badge>}
                  {ad.urgent && <Badge variant="danger">Urgent</Badge>}
                </div>

                <h1 className="text-xl font-black text-slate-900 leading-tight mb-4">{ad.title}</h1>

                <div className="mb-6">
                  <p className="text-4xl font-black text-[#2563EB]">{formatPrice(ad.price)}</p>
                  {ad.negotiable && (
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> Prețul e negociabil
                    </p>
                  )}
                </div>

                {/* CTA buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    size="lg"
                    fullWidth
                    className="gap-2"
                    onClick={() => { addToast('Redirecționare spre plată... (demo)', 'info'); }}
                  >
                    <ShoppingBag className="w-5 h-5" /> Cumpără la {formatPrice(ad.price)}
                  </Button>

                  {ad.negotiable && (
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth
                      className="gap-2"
                      onClick={() => setOfferOpen(true)}
                    >
                      <TrendingDown className="w-5 h-5" /> Fă o ofertă
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    className="gap-2"
                    onClick={() => { addToast('Conversație deschisă cu vânzătorul!', 'success'); }}
                  >
                    <MessageCircle className="w-5 h-5" /> Trimite mesaj
                  </Button>
                </div>

                {/* Meta */}
                <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {timeAgo(ad.postedAt)}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {ad.views} vizualizări</span>
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {ad.favorites} favorite</span>
                </div>

                {/* Action row */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setIsFav(!isFav); addToast(isFav ? 'Eliminat din favorite' : 'Salvat la favorite!', isFav ? 'info' : 'success'); }}
                    className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition', isFav ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-500')}
                  >
                    <Heart className={cn('w-4 h-4', isFav && 'fill-current')} />
                    {isFav ? 'Salvat' : 'Salvează'}
                  </button>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(window.location.href); addToast('Link copiat!', 'success'); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                  >
                    <Share2 className="w-4 h-4" /> Distribuie
                  </button>
                  <button
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition"
                    aria-label="Raportează anunțul"
                    title="Raportează"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Seller card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 mt-4">
                <Link href="/profil" className="flex items-center gap-3 group mb-4">
                  <div className="relative">
                    <img
                      src={ad.seller.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${ad.seller.name}`}
                      alt={ad.seller.name}
                      className="w-12 h-12 rounded-full border-2 border-slate-200 group-hover:border-blue-300 transition"
                    />
                    {ad.seller.verified && (
                      <BadgeCheck className="absolute -bottom-0.5 -right-0.5 w-5 h-5 text-blue-500 fill-blue-500" aria-label="Utilizator verificat" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition">{ad.seller.name}</p>
                    <p className="text-xs text-slate-500">Membru din {ad.seller.memberSince}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
                </Link>

                <div className="flex gap-4 text-sm text-slate-600 mb-4">
                  <div className="text-center flex-1">
                    <p className="font-black text-slate-900 text-base">{ad.seller.adsCount}</p>
                    <p className="text-xs text-slate-400">Anunțuri</p>
                  </div>
                  <div className="text-center flex-1 border-x border-slate-100">
                    <div className="flex items-center justify-center gap-0.5">
                      <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                      <p className="font-black text-slate-900 text-base">{ad.seller.rating.toFixed(1)}</p>
                    </div>
                    <p className="text-xs text-slate-400">{ad.seller.reviewCount} recenzii</p>
                  </div>
                  <div className="text-center flex-1">
                    {ad.seller.verified ? (
                      <>
                        <ShieldCheck className="w-5 h-5 text-green-500 mx-auto" />
                        <p className="text-xs text-green-600 font-medium">Verificat</p>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 mx-auto" />
                        <p className="text-xs text-slate-400">Neverificat</p>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  fullWidth
                  size="sm"
                  className="gap-2"
                  onClick={() => addToast('Funcție disponibilă după autentificare', 'info')}
                >
                  <Phone className="w-4 h-4" /> Afișează numărul
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Related ads */}
        {relatedAds.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-black text-slate-900 mb-5">Anunțuri similare</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedAds.map((a) => <AdCard key={a.id} ad={a} />)}
            </div>
          </section>
        )}
      </div>

      {/* Offer modal */}
      <OfferModal
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        adTitle={ad.title}
        askingPrice={ad.price}
        onSubmit={(amount, message) => {
          console.log('Offer submitted:', amount, message);
          setOfferOpen(false);
          addToast('Oferta ta a fost trimisă vânzătorului!');
        }}
      />
    </>
  );
}
