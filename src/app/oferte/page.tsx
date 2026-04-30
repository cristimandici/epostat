'use client';
import { useState } from 'react';
import { TrendingDown, Check, X, ArrowRight, Timer, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { DEMO_OFFERS, formatPrice, timeAgo } from '@/lib/data';
import { Offer, OfferEvent } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  asteptare: { label: 'În așteptare', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  acceptata: { label: 'Acceptată', color: 'text-green-700', bg: 'bg-green-100' },
  refuzata: { label: 'Refuzată', color: 'text-red-700', bg: 'bg-red-100' },
  contraoferta: { label: 'Contraofertă primită', color: 'text-blue-700', bg: 'bg-blue-100' },
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>(DEMO_OFFERS);
  const [expandedId, setExpandedId] = useState<string | null>(DEMO_OFFERS[0]?.id || null);
  const [counterModal, setCounterModal] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMsg, setCounterMsg] = useState('');

  const accept = (offerId: string) => {
    setOffers((prev) => prev.map((o) => o.id === offerId
      ? { ...o, status: 'acceptata', history: [...o.history, { id: Date.now().toString(), type: 'acceptata', byUser: 'seller', timestamp: new Date().toISOString() }] }
      : o
    ));
  };

  const refuse = (offerId: string) => {
    setOffers((prev) => prev.map((o) => o.id === offerId
      ? { ...o, status: 'refuzata', history: [...o.history, { id: Date.now().toString(), type: 'refuzata', byUser: 'seller', timestamp: new Date().toISOString() }] }
      : o
    ));
  };

  const sendCounter = (offerId: string) => {
    const amount = parseInt(counterAmount);
    if (!amount || isNaN(amount)) return;
    setOffers((prev) => prev.map((o) => o.id === offerId
      ? {
          ...o,
          status: 'contraoferta',
          currentAmount: amount,
          history: [...o.history, { id: Date.now().toString(), type: 'contraoferta', amount, message: counterMsg, byUser: 'seller', timestamp: new Date().toISOString() }],
        }
      : o
    ));
    setCounterModal(null);
    setCounterAmount('');
    setCounterMsg('');
  };

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
            const status = STATUS_CONFIG[offer.status];
            const isExpanded = expandedId === offer.id;

            return (
              <div key={offer.id} className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
                {/* Header */}
                <button
                  className="w-full text-left p-5 flex items-center gap-4 hover:bg-slate-50 transition"
                  onClick={() => setExpandedId(isExpanded ? null : offer.id)}
                >
                  <img src={offer.adImage} alt={offer.adTitle} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm line-clamp-1">{offer.adTitle}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-lg font-black text-[#2563EB]">{formatPrice(offer.currentAmount)}</span>
                      <span className="text-xs text-slate-400 line-through">{formatPrice(offer.originalPrice)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', status.bg, status.color)}>{status.label}</span>
                      {offer.expiresAt && offer.status === 'asteptare' && (
                        <span className="flex items-center gap-1 text-xs text-orange-600">
                          <Timer className="w-3.5 h-3.5" /> Expiră în curând
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                </button>

                {/* Expanded: history + actions */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5">
                    {/* Negotiation history */}
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Istoricul negocierii</p>
                    <div className="flex flex-col gap-3 mb-5">
                      {offer.history.map((evt) => (
                        <HistoryEvent key={evt.id} event={evt} />
                      ))}
                    </div>

                    {/* Action buttons */}
                    {offer.status === 'asteptare' || offer.status === 'contraoferta' ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="primary"
                          className="gap-2 flex-1"
                          onClick={() => accept(offer.id)}
                        >
                          <Check className="w-4 h-4" /> Acceptă {formatPrice(offer.currentAmount)}
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 flex-1"
                          onClick={() => setCounterModal(offer.id)}
                        >
                          <TrendingDown className="w-4 h-4" /> Contraofertă
                        </Button>
                        <Button
                          variant="danger"
                          className="gap-2 flex-1"
                          onClick={() => refuse(offer.id)}
                        >
                          <X className="w-4 h-4" /> Refuză
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className={cn('flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-center', status.bg, status.color)}>
                          {status.label}
                        </div>
                        <Button variant="secondary" className="gap-1.5">
                          <MessageCircle className="w-4 h-4" /> Mesaj
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Counter-offer modal */}
      <Modal open={!!counterModal} onClose={() => setCounterModal(null)} title="Trimite o contraofertă">
        {counterModal && (() => {
          const offer = offers.find((o) => o.id === counterModal)!;
          return (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-500">
                Oferta curentă: <strong className="text-slate-900">{formatPrice(offer.currentAmount)}</strong>
                {' '}(prețul tău: {formatPrice(offer.originalPrice)})
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Suma contraofertei (RON)</label>
                <input
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder={String(Math.round((offer.currentAmount + offer.originalPrice) / 2))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mesaj (opțional)</label>
                <textarea
                  value={counterMsg}
                  onChange={(e) => setCounterMsg(e.target.value)}
                  placeholder="Explică oferta ta..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setCounterModal(null)} className="flex-1">Anulează</Button>
                <Button onClick={() => sendCounter(counterModal)} className="flex-1 gap-2">
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

function HistoryEvent({ event }: { event: OfferEvent }) {
  const isBuyer = event.byUser === 'buyer';
  const configs: Record<string, { icon: React.ReactNode; label: string; bubble: string }> = {
    oferta: { icon: <TrendingDown className="w-3.5 h-3.5" />, label: 'Ofertă', bubble: isBuyer ? 'bg-slate-100 text-slate-800' : 'bg-blue-100 text-blue-800' },
    contraoferta: { icon: <ArrowRight className="w-3.5 h-3.5" />, label: 'Contraofertă', bubble: isBuyer ? 'bg-slate-100 text-slate-800' : 'bg-blue-100 text-blue-800' },
    acceptata: { icon: <Check className="w-3.5 h-3.5" />, label: 'Acceptată', bubble: 'bg-green-100 text-green-800' },
    refuzata: { icon: <X className="w-3.5 h-3.5" />, label: 'Refuzată', bubble: 'bg-red-100 text-red-800' },
  };
  const cfg = configs[event.type];

  return (
    <div className={cn('flex', isBuyer ? 'justify-start' : 'justify-end')}>
      <div className={cn('max-w-[80%] px-4 py-2.5 rounded-2xl text-sm', cfg.bubble)}>
        <div className="flex items-center gap-1.5 mb-0.5 font-semibold text-xs opacity-70">
          {cfg.icon} {isBuyer ? 'Cumpărător' : 'Vânzător'} · {cfg.label}
        </div>
        {event.amount && (
          <p className="text-base font-black">{formatPrice(event.amount)}</p>
        )}
        {event.message && <p className="mt-0.5 opacity-90">{event.message}</p>}
        <p className="text-xs opacity-50 mt-1">{timeAgo(event.timestamp)}</p>
      </div>
    </div>
  );
}
