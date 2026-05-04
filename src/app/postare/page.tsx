'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Tag, FileText, ImagePlus, DollarSign, Check,
  ChevronRight, ChevronLeft, AlertCircle, Upload, X, Sparkles, MapPin,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { CATEGORIES } from '@/lib/data';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

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

const CITIES = ['Alba Iulia', 'Alexandria', 'Arad', 'Bacău', 'Baia Mare', 'Bistrița', 'Botoșani', 'Brăila', 'Brașov', 'București', 'Buzău', 'Călărași', 'Cluj-Napoca', 'Constanța', 'Craiova', 'Deva', 'Drobeta-Turnu Severin', 'Focșani', 'Galați', 'Giurgiu', 'Iași', 'Ilfov', 'Miercurea Ciuc', 'Oradea', 'Piatra Neamț', 'Pitești', 'Ploiești', 'Râmnicu Vâlcea', 'Reșița', 'Satu Mare', 'Sfântu Gheorghe', 'Sibiu', 'Slatina', 'Slobozia', 'Suceava', 'Târgu Jiu', 'Târgu Mureș', 'Târgoviște', 'Timișoara', 'Tulcea', 'Vaslui', 'Zalău'];

const CAT_ICONS: Record<string, string> = {
  'Laptop': '💻', 'Car': '🚗', 'Home': '🏠', 'Shirt': '👗',
  'Sofa': '🛋️', 'Dumbbell': '🏋️', 'Baby': '🧸', 'PawPrint': '🐾',
  'Wrench': '🔧',
};

const CONDITION_LABELS: Record<string, string> = {
  'nou': 'Nou', 'ca-nou': 'Ca nou', 'buna-stare': 'Stare bună',
  'uzura-normala': 'Uzură normală', 'necesita-reparatii': 'Necesită reparații',
};

interface FormData {
  category: string;
  title: string;
  condition: string;
  description: string;
  imageFiles: File[];
  imageUrls: string[];
  price: string;
  negotiable: boolean;
  city: string;
  location: string;
  phone: string;
}

const EMPTY_FORM: FormData = {
  category: '', title: '', condition: '', description: '',
  imageFiles: [], imageUrls: [],
  price: '', negotiable: false, city: '', location: '', phone: '',
};

export default function PostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const set = (key: keyof FormData, value: unknown) =>
    setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    async function prefillFromProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('phone, city').eq('id', user.id).single();
      if (data?.phone) set('phone', data.phone as string);
      if (data?.city) set('city', data.city as string);
    }
    prefillFromProfile();
  }, []);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (step === 1 && !form.category) e.category = 'Hopa, alege o categorie 🙂';
    if (step === 2) {
      if (!form.title || form.title.length < 5) e.title = 'Titlul trebuie să aibă cel puțin 5 caractere.';
      if (!form.condition) e.condition = 'Selectează starea produsului.';
      if (!form.description || form.description.length < 20) e.description = 'Adaugă o descriere mai detaliată (min. 20 caractere).';
    }
    if (step === 3 && form.imageUrls.length < 3) e.images = 'Adaugă cel puțin 3 fotografii 📸';
    if (step === 4) {
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Introdu un preț valid.';
      if (!form.city) e.city = 'Alege un oraș.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep((s) => s + 1); };
  const prev = () => setStep((s) => s - 1);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 10 - form.imageUrls.length;
    const toProcess = files.slice(0, remaining);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErrors({ images: 'Trebuie să fii autentificat pentru a încărca imagini.' }); return; }

    for (let i = 0; i < toProcess.length; i++) {
      const file = toProcess[i];
      const idx = form.imageUrls.length + i;
      setUploadingIdx(idx);

      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from('ad-images').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('ad-images').getPublicUrl(path);
        setForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, publicUrl] }));
        setErrors((p) => ({ ...p, images: undefined }));
      }
    }
    setUploadingIdx(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (i: number) =>
    set('imageUrls', form.imageUrls.filter((_, idx) => idx !== i));

  const handlePublish = async () => {
    if (!validate()) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?redirect=/postare');
      return;
    }

    const { data, error } = await supabase.from('ads').insert({
      title: form.title,
      description: form.description,
      price: Number(form.price),
      negotiable: form.negotiable,
      category_id: form.category,
      condition: form.condition,
      images: form.imageUrls,
      city: form.city,
      location: form.location || null,
      seller_id: user.id,
      status: 'activ',
    }).select('id').single();

    if (error) {
      setErrors({ submit: error.message });
      setLoading(false);
      return;
    }

    // Update seller phone if provided
    if (form.phone) {
      await supabase.from('profiles').update({ phone: form.phone }).eq('id', user.id);
    }

    setPublishedId(data.id);
    setLoading(false);
  };

  if (publishedId) {
    return (
      <>
        <TopBar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-lg w-full text-center py-16">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3">E postat! 🎉</h1>
            <p className="text-slate-500 mb-2">Anunțul tău pentru <strong className="text-slate-800">{form.title}</strong> este acum live.</p>
            <p className="text-slate-400 text-sm mb-8">Mii de cumpărători îl pot vedea deja.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push(`/anunturi/${publishedId}`)} variant="primary" size="lg">
                <Sparkles className="w-4 h-4" /> Vezi anunțul
              </Button>
              <Button onClick={() => { setForm(EMPTY_FORM); setStep(1); setPublishedId(null); }} variant="secondary" size="lg">
                Postează altul
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const cat = CATEGORIES.find(c => c.id === form.category);

  return (
    <>
      {/* ── Top bar ── */}
      <TopBar />

      {/* ── Progress bar ── */}
      <div className="w-full h-2 bg-slate-100 shrink-0">
        <div
          className="h-full bg-[#2563EB] transition-all duration-500 ease-out"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* ── Main split ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: scrollable form */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[560px] mx-auto px-6 sm:px-10 py-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium mb-3 flex-wrap">
              {['Categorie', 'Detalii', 'Fotografii', 'Preț'].map((label, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
                  <span className={cn(
                    step === i + 1 ? 'text-slate-800 font-semibold' :
                    step > i + 1 ? 'text-green-600' : ''
                  )}>
                    {step > i + 1 ? '✓ ' : ''}{label}
                  </span>
                </span>
              ))}
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-900">
                {step === 1 && 'Ce vinzi?'}
                {step === 2 && 'Detalii produs'}
                {step === 3 && 'Fotografii'}
                {step === 4 && 'Preț și publicare'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">Pasul {step} din 4 · Gratuit · Sub 2 minute</p>
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
                    form.category === cat.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2.5', cat.color)}>
                    <span className="text-lg">{CAT_ICONS[cat.icon] ?? '📦'}</span>
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Titlu anunț <span className="text-red-400">*</span></label>
              <input type="text" value={form.title} onChange={(e) => { set('title', e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
                placeholder="Ex: iPhone 14 Pro Max 256GB – Space Black, ca nou" maxLength={80}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              <div className="flex justify-between mt-1">
                {errors.title ? <ErrorMsg msg={errors.title} /> : <span />}
                <span className="text-xs text-slate-400">{form.title.length}/80</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Stare produs <span className="text-red-400">*</span></label>
              {errors.condition && <ErrorMsg msg={errors.condition} />}
              <div className="grid grid-cols-1 gap-2">
                {CONDITIONS.map((c) => (
                  <label key={c.value} className={cn('flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all', form.condition === c.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300')}>
                    <input type="radio" name="condition" value={c.value} checked={form.condition === c.value}
                      onChange={() => { set('condition', c.value); setErrors((p) => ({ ...p, condition: undefined })); }}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500" />
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{c.label}</p>
                      <p className="text-xs text-slate-500">{c.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Descriere <span className="text-red-400">*</span></label>
              <textarea value={form.description} onChange={(e) => { set('description', e.target.value); setErrors((p) => ({ ...p, description: undefined })); }}
                placeholder="Descrie starea produsului, ce include, motivul vânzării..." rows={5} maxLength={2000}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
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
            {/* Tip banner */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5">
              <span className="text-amber-500 text-lg shrink-0">📸</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">Anunțurile cu 5+ fotografii se vând de 2× mai repede</p>
                <p className="text-xs text-amber-600 mt-0.5">Toate unghiurile · Close-up · Marcă &amp; etichetă · Uzură &amp; defecte</p>
              </div>
            </div>

            {errors.images && <ErrorMsg msg={errors.images} className="mb-3" />}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {(() => {
              const filled = form.imageUrls.length;
              const isUp = uploadingIdx !== null;
              const slotCount = Math.min(10, Math.max(6, filled + (isUp ? 1 : 0) + (filled < 10 ? 1 : 0)));
              return (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {Array.from({ length: slotCount }).map((_, i) => {
                    const url = form.imageUrls[i];
                    if (url) {
                      return (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                          <img src={url} alt={`Fotografie ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest bg-[#2563EB] text-white">COVER</span>
                          )}
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }
                    if (isUp && i === filled) {
                      return (
                        <div key={i} className="aspect-square rounded-xl border-2 border-blue-300 bg-blue-50 flex items-center justify-center">
                          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                        </div>
                      );
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={filled >= 10}
                        className={cn(
                          'aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all',
                          i === 0
                            ? 'border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-400 hover:text-blue-500 hover:border-blue-400'
                            : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50 text-slate-300 hover:text-slate-400 hover:border-slate-300'
                        )}
                      >
                        {i === 0 ? (
                          <>
                            <Upload className="w-5 h-5" />
                            <span className="text-[10px] font-bold tracking-widest">COVER</span>
                          </>
                        ) : (
                          <span className="text-2xl font-light leading-none">+</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {form.imageUrls.length < 3 && (
              <p className="text-xs text-slate-400 mb-3">
                Mai ai nevoie de {3 - form.imageUrls.length} {3 - form.imageUrls.length === 1 ? 'fotografie' : 'fotografii'} (minim 3)
              </p>
            )}

            <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-4 py-3">
              💡 JPG / PNG / WebP · max 10 MB per poză · până la 10 fotografii
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Preț (RON) <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">RON</span>
                <input type="number" value={form.price} onChange={(e) => { set('price', e.target.value); setErrors((p) => ({ ...p, price: undefined })); }}
                  placeholder="0" min={1}
                  className="w-full pl-14 pr-4 py-3 rounded-xl border border-slate-200 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              {errors.price && <ErrorMsg msg={errors.price} />}
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
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
                <select value={form.city} onChange={(e) => { set('city', e.target.value); setErrors((p) => ({ ...p, city: undefined })); }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selectează...</option>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                {errors.city && <ErrorMsg msg={errors.city} />}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cartier / zonă</label>
                <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)}
                  placeholder="Ex: Florești"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Număr de telefon</label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                placeholder="07xx xxx xxx"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              <p className="text-xs text-slate-400 mt-1">Vizibil doar pentru cumpărătorii interesați.</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-3">Sumar anunț</p>
              <div className="flex flex-col gap-1.5 text-sm">
                <Row label="Categorie" value={CATEGORIES.find((c) => c.id === form.category)?.name || '—'} />
                <Row label="Titlu" value={form.title || '—'} />
                <Row label="Stare" value={form.condition || '—'} />
                <Row label="Fotografii" value={`${form.imageUrls.length} foto`} />
                <Row label="Preț" value={form.price ? `${Number(form.price).toLocaleString('ro-RO')} RON${form.negotiable ? ' (negociabil)' : ''}` : '—'} />
                <Row label="Locație" value={form.city || '—'} />
              </div>
            </div>
            {errors.submit && <ErrorMsg msg={errors.submit} />}
          </div>
        )}

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

            </div>{/* max-w */}
          </div>{/* left scroll */}

        {/* Divider */}
        <div className="hidden lg:block w-px bg-slate-100 shrink-0" />

        {/* RIGHT: Preview (desktop only) */}
        <div className="hidden lg:flex flex-1 overflow-y-auto bg-[#F5F7FA]">
          <div className="max-w-[560px] mx-auto px-6 sm:px-10 py-10 w-full">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Previzualizare anunț</p>
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              {/* Main image */}
              <div className="aspect-[4/3] bg-slate-100 relative">
                {form.imageUrls[0] ? (
                  <img src={form.imageUrls[0]} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
                    <ImagePlus className="w-12 h-12" />
                    <span className="text-xs">Nicio fotografie</span>
                  </div>
                )}
                {form.condition && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm">
                    {CONDITION_LABELS[form.condition]}
                  </span>
                )}
                {form.negotiable && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                    Negociabil
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {form.imageUrls.length > 1 && (
                <div className="flex gap-1.5 px-3 py-2 border-b border-slate-100 overflow-x-auto">
                  {form.imageUrls.slice(0, 5).map((url, i) => (
                    <img key={i} src={url} alt=""
                      className={cn('w-10 h-10 object-cover rounded-lg shrink-0', i === 0 && 'ring-2 ring-blue-500')}
                    />
                  ))}
                </div>
              )}

              {/* Details */}
              <div className="p-5">
                <p className={cn('font-bold text-slate-900 text-lg leading-snug', !form.title && 'text-slate-300 font-normal text-base')}>
                  {form.title || 'Titlul anunțului...'}
                </p>
                <p className={cn('text-3xl font-black mt-1', form.price ? 'text-[#2563EB]' : 'text-slate-200')}>
                  {form.price ? `${Number(form.price).toLocaleString('ro-RO')} RON` : '— RON'}
                </p>
                <div className="flex items-center gap-3 mt-4 text-sm text-slate-500 flex-wrap">
                  {cat && <span className="flex items-center gap-1">{CAT_ICONS[cat.icon] ?? '📦'} {cat.name}</span>}
                  {form.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {form.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between px-6 h-14 border-b border-slate-100 shrink-0 bg-white">
      <Link href="/" className="text-lg font-black text-slate-900 tracking-tight">
        e<span className="text-[#2563EB]">postat</span><span className="text-slate-400 font-normal">.ro</span>
      </Link>
      <Link href="/" aria-label="Închide"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
        <X className="w-5 h-5" />
      </Link>
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
