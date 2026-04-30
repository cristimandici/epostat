'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingDown, Check, X, ArrowRight, Timer, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatPrice, timeAgo } from '@/lib/data';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&auto=format';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  asteptare:   { label: 'În așteptare',     color: 'text-yellow-700', bg: 'bg-yellow-100' },
  acceptata:   { label: 'Acceptată',        color: 'text-green-700',  bg: 'bg-green-100'  },
  refuzata:    { label: 'Refuzată',         color: 'text-red-700',    bg: 'bg-red-100'    },
  contraoferta:{ label: 'Contraofertă primită', color: 'text-blue-700', bg: 'bg-blue-100' },
};

interface DbEvent {
  id: string;
  type: string;
  amount: number | null;
  message: string | null;
  by_user: string;
  created_at: string;
}

interface DbOffer {
  id: string;
  ad_id: string;
  buyer_id: string;
  seller_id: string;
  original_price: number;
  current_amount: number;
  status: string;
  created_at: string;
  ads: { title: string; images: string[] } | null;
  offer_events: DbEvent[];
}

export default function OffersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [offers, setOffers] = useState<DbOffer[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [counterModal, setCounterModal] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMsg, setCounterMsg] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login?redirect=/oferte'); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from('offers')
        .select('*, ads(title, images), offer_events(*)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      const rows = (data || []) as DbOffer[];
      // Sort events within each offer by created_at
      rows.forEach(o => {
        o.offer_events = (o.offer_events || []).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
      setOffers(rows);
      if (rows[0]) setExpandedId(rows[0].id);
      setLoading(false);
    }
    load();
  }, []);

  const updateOffer = (id: string, patch: Partial<DbOffer>) =>
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));

  const accept = async (offer: DbOffer) => {
    setActionLoading(offer.id + '_accept');
    const role = offer.buyer_id === userId ? 'buyer' : 'seller';
    await supabase.from('offers').update({ status: 'acceptata' }).eq('id', offer.id);
    const { data: ev } = await supabase.from('offer_events').insert({
      offer_id: offer.id, type: 'acceptata', by_user: role,
    }).select().single();
    updateOffer(offer.id, {
      status: 'acceptata',
      offer_events: [...offer.offer_events, ev as DbEvent],
    });
    setActionLoading('');
  };

  const refuse = async (offer: DbOffer) => {
    setActionLoading(offer.id + '_refuse');
    const role = offer.buyer_id === userId ? 'buyer' : 'seller';
    await supabase.from('offers').update({ status: 'refuzata' }).eq('id', offer.id);
    const { data: ev } = await supabase.from('offer_events').insert({
      offer_id: offer.id, type: 'refuzata', by_user: role,
    }).select().single();
    updateOffer(offer.id, {
      status: 'refuzata',
      offer_events: [...offer.offer_events, ev as DbEvent],
    });
    setActionLoading('');
  };

  const sendCounter = async (offer: DbOffer) => {
    const amount = parseInt(counterAmount);
    if (!amount || isNaN(amount)) return;
    setActionLoading(offer.id + '_counter');
    const role = offer.buyer_id === userId ? 'buyer' : 'seller';
    await supabase.from('offers').update({ status: 'contraoferta', current_amount: amount }).eq('id', offer.id);
    const { data: ev } = await supabase.from('offer_events').insert({
      offer_id: offer.id, type: 'contraoferta', amount, message: counterMsg || null, by_user: role,
    }).select().single();
    updateOffer(offer.id, {
      status: 'contraoferta',
      current_amount: amount,
      offer_events: [...offer.offer_events, ev as DbEvent],
    });
    setCounterModal(null);
    setCounterAmount('');
    setCounterMsg('');
    setActionLoading('');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-7">
        <h1 className="text-2xl font-black text-slate-900">Ofertele mele</h1>
        <p className="text-slate-500 text-sm mt-1">Gestionează ofertele primite și trimise</p>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Nicio ofertă deocamdată</h3>
          <p className="text-slate-500 text-sm">Când cineva face o ofertă pentru anunțurile tale, o vei vedea aici.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {offers.map((offer) => {
            const status = STATUS_CONFIG[offer.status] || STATUS_CONFIG.asteptare;
            const isExpanded = expandedId === offer.id;
            const adImage = offer.ads?.images?.[0] || PLACEHOLDER;
            const adTitle = offer.ads?.title || 'Anunț șters';
            const iAmBuyer = offer.buyer_id === userId;

            // Build history: synthetic first event + real events
            const allEvents: DbEvent[] = offer.offer_events.length > 0
              ? offer.offer_events
              : [{
                  id: 'init_' + offer.id,
                  type: 'oferta',
                  amount: offer.current_amount,
                  message: null,
                  by_user: 'buyer',
                  created_at: offer.created_at,
                }];

            const canAct = offer.status === 'asteptare' || offer.status === 'contraoferta';
            // Buyer can act on counter-offer from seller; seller can act on buyer's offer
            const myTurn = canAct && (
              (offer.status === 'asteptare' && !iAmBuyer) ||
              (offer.status === 'contraoferta' && (
                // last event by the other party
                allEvents[allEvents.length - 1]?.by_user !== (iAmBuyer ? 'buyer' : 'seller')
              ))
            );

            return (
              <div key={offer.id} className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
                <button
                  className="w-full text-left p-5 flex items-center gap-4 hover:bg-slate-50 transition"
                  onClick={() => setExpandedId(isExpanded ? null : offer.id)}
                >
                  <img src={adImage} alt={adTitle} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm line-clamp-1">{adTitle}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-lg font-black text-[#2563EB]">{formatPrice(offer.current_amount)}</span>
                      <span className="text-xs text-slate-400 line-through">{formatPrice(offer.original_price)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', status.bg, status.color)}>
                        {status.label}
                      </span>
                      <span className="text-xs text-slate-400">{iAmBuyer ? 'Ofertă trimisă' : 'Ofertă primită'}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Istoricul negocierii</p>
                    <div className="flex flex-col gap-3 mb-5">
                      {allEvents.map((evt) => {
                        const evtIsBuyer = evt.by_user === 'buyer';
                        const isMe = (evtIsBuyer && iAmBuyer) || (!evtIsBuyer && !iAmBuyer);
                        return (
                          <div key={evt.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                            <div className={cn('max-w-[80%] px-4 py-2.5 rounded-2xl text-sm',
                              isMe ? 'bg-[#2563EB] text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm')}>
                              <div className={cn('flex items-center gap-1.5 mb-0.5 font-semibold text-xs', isMe ? 'opacity-70' : 'opacity-60')}>
                                {evtIsBuyer ? 'Cumpărător' : 'Vânzător'} ·{' '}
                                {evt.type === 'oferta' ? 'Ofertă' : evt.type === 'contraoferta' ? 'Contraofertă' : evt.type === 'acceptata' ? 'Acceptată' : 'Refuzată'}
                              </div>
                              {evt.amount && <p className="text-base font-black">{formatPrice(evt.amount)}</p>}
                              {evt.message && <p className="mt-0.5 opacity-90">{evt.message}</p>}
                              <p className={cn('text-xs mt-1', isMe ? 'opacity-50' : 'text-slate-400')}>{timeAgo(evt.created_at)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {myTurn ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="primary" className="gap-2 flex-1"
                          loading={actionLoading === offer.id + '_accept'}
                          onClick={() => accept(offer)}>
                          <Check className="w-4 h-4" /> Acceptă {formatPrice(offer.current_amount)}
                        </Button>
                        <Button variant="outline" className="gap-2 flex-1"
                          onClick={() => { setCounterModal(offer.id); setCounterAmount(''); }}>
                          <TrendingDown className="w-4 h-4" /> Contraofertă
                        </Button>
                        <Button variant="danger" className="gap-2 flex-1"
                          loading={actionLoading === offer.id + '_refuse'}
                          onClick={() => refuse(offer)}>
                          <X className="w-4 h-4" /> Refuză
                        </Button>
                      </div>
                    ) : canAct ? (
                      <div className="px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 text-sm text-center">
                        <Timer className="w-4 h-4 inline mr-1.5" />
                        Aștepți răspunsul {iAmBuyer ? 'vânzătorului' : 'cumpărătorului'}
                      </div>
                    ) : (
                      <div className={cn('px-4 py-2.5 rounded-xl text-sm font-semibold text-center', status.bg, status.color)}>
                        {status.label}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!counterModal} onClose={() => setCounterModal(null)} title="Trimite o contraofertă">
        {counterModal && (() => {
          const offer = offers.find(o => o.id === counterModal)!;
          return (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-500">
                Oferta curentă: <strong className="text-slate-900">{formatPrice(offer.current_amount)}</strong>
                {' '}(prețul inițial: {formatPrice(offer.original_price)})
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Suma contraofertei (RON)</label>
                <input type="number" value={counterAmount} onChange={e => setCounterAmount(e.target.value)}
                  placeholder={String(Math.round((offer.current_amount + offer.original_price) / 2))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mesaj (opțional)</label>
                <textarea value={counterMsg} onChange={e => setCounterMsg(e.target.value)}
                  placeholder="Explică oferta ta..." rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setCounterModal(null)} className="flex-1">Anulează</Button>
                <Button loading={actionLoading === counterModal + '_counter'}
                  onClick={() => sendCounter(offer)} className="flex-1 gap-2">
                  Trimite <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
