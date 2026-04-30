'use client';
import { useState } from 'react';
import { TrendingDown, Check, X, ArrowRight, Timer, Info } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/data';

interface OfferModalProps {
  open: boolean;
  onClose: () => void;
  adTitle: string;
  askingPrice: number;
  onSubmit: (amount: number, message: string) => void;
}

export default function OfferModal({ open, onClose, adTitle, askingPrice, onSubmit }: OfferModalProps) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const suggestedAmounts = [
    Math.round(askingPrice * 0.9),
    Math.round(askingPrice * 0.85),
    Math.round(askingPrice * 0.8),
  ];

  const numAmount = parseInt(amount.replace(/\D/g, ''), 10);
  const discount = numAmount ? Math.round((1 - numAmount / askingPrice) * 100) : 0;

  const handleSubmit = () => {
    if (!numAmount || isNaN(numAmount)) {
      setError('Hopa, introdu o sumă validă 🙂');
      return;
    }
    if (numAmount >= askingPrice) {
      setError('Oferta trebuie să fie mai mică decât prețul cerut.');
      return;
    }
    if (numAmount < askingPrice * 0.3) {
      setError('Oferta pare prea mică. Încearcă o sumă mai rezonabilă 😊');
      return;
    }
    setError('');
    onSubmit(numAmount, message);
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    setAmount('');
    setMessage('');
    setError('');
    onClose();
  };

  if (submitted) {
    return (
      <Modal open={open} onClose={handleClose}>
        <div className="text-center py-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Ofertă trimisă! 🎉</h3>
            <p className="text-slate-500 mt-1 text-sm">
              Vânzătorul a primit oferta ta de <strong className="text-slate-800">{formatPrice(numAmount)}</strong>.
              <br />Vei primi o notificare când răspunde (max 48h).
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 rounded-xl px-4 py-2.5 text-sm">
            <Timer className="w-4 h-4 shrink-0" />
            <span>Oferta expiră în <strong>48 de ore</strong> dacă vânzătorul nu răspunde.</span>
          </div>
          <Button fullWidth onClick={handleClose}>Înapoi la anunț</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Fă o ofertă">
      <div className="flex flex-col gap-4">
        {/* Ad context */}
        <div className="bg-slate-50 rounded-xl p-3 text-sm">
          <p className="text-slate-500 text-xs mb-1">Anunț</p>
          <p className="font-semibold text-slate-800 line-clamp-1">{adTitle}</p>
          <p className="text-slate-500 mt-0.5">
            Preț cerut: <span className="font-bold text-slate-900">{formatPrice(askingPrice)}</span>
          </p>
        </div>

        {/* Quick suggestions */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Sugestii rapide:</p>
          <div className="flex gap-2">
            {suggestedAmounts.map((s) => (
              <button
                key={s}
                onClick={() => setAmount(String(s))}
                className={`flex-1 py-2 px-2 rounded-xl border text-sm font-semibold transition-all ${
                  numAmount === s
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {formatPrice(s)}
                <span className="block text-xs font-normal text-slate-400">
                  -{Math.round((1 - s / askingPrice) * 100)}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Suma ta (lei)
          </label>
          <div className="relative">
            <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              placeholder={`Ex: ${Math.round(askingPrice * 0.88)}`}
              min={1}
              max={askingPrice - 1}
              className="w-full pl-10 pr-16 py-3 rounded-xl border border-slate-200 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">RON</span>
          </div>
          {numAmount > 0 && numAmount < askingPrice && (
            <p className="mt-1 text-xs text-blue-600 font-medium">
              Reducere: -{discount}% față de prețul cerut
            </p>
          )}
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        {/* Optional message */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Mesaj pentru vânzător <span className="text-slate-400 font-normal">(opțional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex: Pot ridica azi, plată cash..."
            rows={2}
            maxLength={200}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-xl px-3 py-2 text-xs">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Vânzătorul poate accepta, refuza sau contraferta. Oferta expiră în 48h.</span>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleClose} className="flex-1">Anulează</Button>
          <Button onClick={handleSubmit} className="flex-1 gap-2">
            Trimite oferta <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
