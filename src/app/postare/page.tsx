'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Tag, FileText, ImagePlus, DollarSign, Check,
  ChevronRight, ChevronLeft, AlertCircle, Upload, X, Sparkles,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { CATEGORIES } from '@/lib/data';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Categorie', icon: <Tag className="w-5 h-5" /> },
  { id: 2, label: 'Detalii', icon: <FileText className="w-5 h-5" /> },
  { id: 3, label: 'Foto', icon: <ImagePlus className="w-5 h-5" /> },
  { id: 4, label: 'Preț & Publicare', icon: <DollarSign className="w-5 h-5" /> },
];

const CONDITIONS = [
  { value: 'nou', label: 'Nou', desc: 'Produs sigilat, neutilizat' },
  { value: 'ca-nou', label: 'Ca nou', desc: 'Folosit puțin, fără defecte' },
  { value: 'buna-stare', label: 'Stare bună', desc: 'Urme normale de folosire' },
  { value: 'uzura-normala', label: 'Uzură normală', desc: 'Funcționează, are semne de uz' },
  { value: 'necesita-reparatii', label: 'Necesită reparații', desc: 'Vânzare ca atare' },
];

const CITIES = ['București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Brașov', 'Constanța', 'Sibiu', 'Craiova', 'Galați', 'Oradea', 'Bacău', 'Arad', 'Ploiești', 'Pitești'];

interface FormData {
  category: string;
  title: string;
  condition: string;
  description: string;
  images: string[];
  price: string;
  negotiable: boolean;
  city: string;
  location: string;
  phone: string;
}

const EMPTY_FORM: FormData = {
  category: '', title: '', condition: '', description: '',
  images: [], price: '', negotiable: false, city: '', location: '', phone: '',
};

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format',
];

export default function PostPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof FormData, value: string | boolean | string[]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (step === 1 && !form.category) newErrors.category = 'Hopa, alege o categorie 🙂';
    if (step === 2) {
      if (!form.title || form.title.length < 5) newErrors.title = 'Titlul trebuie să aibă cel puțin 5 caractere.';
      if (!form.condition) newErrors.condition = 'Selectează starea produsului.';
      if (!form.description || form.description.length < 20) newErrors.description = 'Adaugă o descriere mai detaliată (min. 20 caractere).';
    }
    if (step === 3 && form.images.length === 0) newErrors.images = 'Adaugă cel puțin o fotografie 📸';
    if (step === 4) {
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) newErrors.price = 'Introdu un preț valid.';
      if (!form.city) newErrors.city = 'Alege un oraș.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => { if (validate()) setStep((s) => s + 1); };
  const prev = () => setStep((s) => s - 1);

  const handlePublish = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setPublished(true);
  };

  const addDemoImage = () => {
    const idx = form.images.length % PLACEHOLDER_IMAGES.length;
    set('images', [...form.images, PLACEHOLDER_IMAGES[idx]]);
  };

  const removeImage = (i: number) =>
    set('images', form.images.filter((_, idx) => idx !== i));

  if (published) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">E postat! 🎉</h1>
        <p className="text-slate-500 mb-2">Anunțul tău pentru <strong className="text-slate-800">{form.title}</strong> este acum live.</p>
        <p className="text-slate-400 text-sm mb-8">Mii de cumpărători îl pot vedea deja.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => router.push('/anunturi/a1')} variant="primary" size="lg">
            <Sparkles className="w-4 h-4" /> Vezi anunțul
          </Button>
          <Button onClick={() => { setForm(EMPTY_FORM); setStep(1); setPublished(false); }} variant="secondary" size="lg">
            Postează altul
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 mb-1">Postează un anunț nou</h1>
        <p className="text-slate-500 text-sm">Gratuit · Durează sub 2 minute</p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all',
                  step > s.id ? 'bg-green-500 text-white' : step === s.id ? 'bg-[#2563EB] text-white shadow-lg scale-110' : 'bg-slate-200 text-slate-500'
                )}>
                  {step > s.id ? <Check className="w-5 h-5" /> : s.icon}
                </div>
                <span className={cn('text-xs mt-1.5 font-medium hidden sm:block', step === s.id ? 'text-blue-600' : step > s.id ? 'text-green-600' : 'text-slate-400')}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-2 transition-all', step > s.id ? 'bg-green-400' : 'bg-slate-200')} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        {/* Step 1: Category */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Ce vinzi?</h2>
            <p className="text-sm text-slate-500 mb-5">Alege categoria potrivită pentru produsul tău.</p>
            {errors.category && <ErrorMsg msg={errors.category} />}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { set('category', cat.id); setErrors({}); }}
                  className={cn(
                    'p-4 rounded-2xl border-2 text-left transition-all',
                    form.category === cat.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2.5', cat.color)}>
                    <span className="text-lg">
                      {cat.icon === 'Laptop' ? '💻' : cat.icon === 'Car' ? '🚗' : cat.icon === 'Home' ? '🏠' : cat.icon === 'Shirt' ? '👗' : cat.icon === 'Sofa' ? '🛋️' : cat.icon === 'Dumbbell' ? '🏋️' : cat.icon === 'Baby' ? '🧸' : cat.icon === 'PawPrint' ? '🐾' : cat.icon === 'Wrench' ? '🔧' : '📦'}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{cat.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Detalii produs</h2>
              <p className="text-sm text-slate-500">Descrie produsul cât mai complet.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Titlu anunț <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => { set('title', e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
                placeholder="Ex: iPhone 14 Pro Max 256GB – Space Black, ca nou"
                maxLength={80}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <div className="flex justify-between mt-1">
                {errors.title ? <ErrorMsg msg={errors.title} /> : <span />}
                <span className="text-xs text-slate-400">{form.title.length}/80</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Stare produs <span className="text-red-400">*</span>
              </label>
              {errors.condition && <ErrorMsg msg={errors.condition} />}
              <div className="grid grid-cols-1 gap-2">
                {CONDITIONS.map((c) => (
                  <label key={c.value} className={cn('flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all', form.condition === c.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300')}>
                    <input
                      type="radio"
                      name="condition"
                      value={c.value}
                      checked={form.condition === c.value}
                      onChange={() => { set('condition', c.value); setErrors((p) => ({ ...p, condition: undefined })); }}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{c.label}</p>
                      <p className="text-xs text-slate-500">{c.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Descriere <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => { set('description', e.target.value); setErrors((p) => ({ ...p, description: undefined })); }}
                placeholder="Descrie starea produsului, ce include, motivul vânzării..."
                rows={5}
                maxLength={2000}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <div className="flex justify-between mt-1">
                {errors.description ? <ErrorMsg msg={errors.description} /> : <span />}
                <span className="text-xs text-slate-400">{form.description.length}/2000</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Fotografii</h2>
            <p className="text-sm text-slate-500 mb-5">Anunțurile cu poze se vând de 5× mai repede. Adaugă până la 10 fotografii.</p>
            {errors.images && <ErrorMsg msg={errors.images} className="mb-3" />}

            <div className="grid grid-cols-3 gap-3 mb-4">
              {form.images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={img} alt={`Fotografie ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-bold bg-blue-600 text-white">Principală</span>
                  )}
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                    aria-label="Șterge fotografia"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {form.images.length < 10 && (
                <button
                  onClick={addDemoImage}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-500 transition-all"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-medium">Adaugă foto</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-4 py-3">
              💡 <strong>Sfat:</strong> Poza principală apare în listing. Folosește poze luminoase, din mai multe unghiuri.
              <br /><span className="text-blue-500">(Demo: apasă butonul de mai sus pentru a adăuga imagini placeholder)</span>
            </p>
          </div>
        )}

        {/* Step 4: Price & Publish */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Preț și publicare</h2>
              <p className="text-sm text-slate-500">Ultimul pas! Setează prețul și publică.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Preț (RON) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">RON</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => { set('price', e.target.value); setErrors((p) => ({ ...p, price: undefined })); }}
                  placeholder="0"
                  min={1}
                  className="w-full pl-14 pr-4 py-3 rounded-xl border border-slate-200 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              {errors.price && <ErrorMsg msg={errors.price} />}
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={cn('relative w-11 h-6 rounded-full transition-colors', form.negotiable ? 'bg-blue-600' : 'bg-slate-300')}>
                <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', form.negotiable ? 'translate-x-5' : 'translate-x-0.5')} />
                <input type="checkbox" className="sr-only" checked={form.negotiable} onChange={(e) => set('negotiable', e.target.checked)} />
              </div>
              <div>
                <p className="font-medium text-slate-800 text-sm">Prețul este negociabil</p>
                <p className="text-xs text-slate-500">Cumpărătorii pot face oferte</p>
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Oraș <span className="text-red-400">*</span></label>
                <select
                  value={form.city}
                  onChange={(e) => { set('city', e.target.value); setErrors((p) => ({ ...p, city: undefined })); }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selectează...</option>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                {errors.city && <ErrorMsg msg={errors.city} />}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cartier / zonă</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="Ex: Florești"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Număr de telefon</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="07xx xxx xxx"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <p className="text-xs text-slate-400 mt-1">Vizibil doar pentru cumpărătorii interesați.</p>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-3">Sumar anunț</p>
              <div className="flex flex-col gap-1.5 text-sm">
                <Row label="Categorie" value={CATEGORIES.find((c) => c.id === form.category)?.name || '—'} />
                <Row label="Titlu" value={form.title || '—'} />
                <Row label="Stare" value={form.condition || '—'} />
                <Row label="Fotografii" value={`${form.images.length} foto`} />
                <Row label="Preț" value={form.price ? `${Number(form.price).toLocaleString('ro-RO')} RON${form.negotiable ? ' (negociabil)' : ''}` : '—'} />
                <Row label="Locație" value={form.city || '—'} />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={cn('flex gap-3 mt-6 pt-5 border-t border-slate-100', step === 1 ? 'justify-end' : 'justify-between')}>
          {step > 1 && (
            <Button variant="secondary" onClick={prev} className="gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Înapoi
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={next} className="gap-1.5">
              Continuă <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handlePublish} loading={loading} variant="accent" size="lg" className="gap-2">
              <Sparkles className="w-4 h-4" /> Publică anunțul
            </Button>
          )}
        </div>
      </div>

      {/* Auto-save hint */}
      <p className="text-center text-xs text-slate-400 mt-4">💾 Progresul tău este salvat automat</p>
    </div>
  );
}

function ErrorMsg({ msg, className }: { msg: string; className?: string }) {
  return (
    <p className={cn('flex items-center gap-1.5 text-xs text-red-500 mt-1', className)}>
      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {msg}
    </p>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}
