'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check, ChevronDown, AlertCircle, Upload, X, Sparkles, MapPin, ImagePlus,
  BookmarkCheck, RotateCcw, Trash2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { CATEGORIES } from '@/lib/data';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

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

const SECTIONS = [
  { id: 1, label: 'Categorie' },
  { id: 2, label: 'Detalii produs' },
  { id: 3, label: 'Fotografii' },
  { id: 4, label: 'Preț & Publicare' },
];

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

const DRAFT_KEY = 'epostat_post_draft';

function hasMeaningfulData(form: FormData): boolean {
  return !!(form.category || form.title || form.description || form.imageUrls.length || form.price);
}

function saveDraftToStorage(form: FormData) {
  const { imageFiles: _, ...rest } = form;
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...rest, savedAt: Date.now() }));
}

function loadDraftFromStorage(): (Omit<FormData, 'imageFiles'> & { savedAt?: number }) | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export default function PostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openStep, setOpenStep] = useState<number | null>(1);
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [draftBanner, setDraftBanner] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftAdId, setDraftAdId] = useState<string | null>(null);

  // Keep a ref so popstate handler always sees latest form
  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  // Track leave source so we know how to navigate away after modal confirm
  const leaveSourceRef = useRef<'button' | 'back'>('button');

  const set = (key: keyof FormData, value: unknown) =>
    setForm((p) => ({ ...p, [key]: value }));

  // Save draft to DB (insert or update)
  const saveDraftToDB = useCallback(async (f: FormData): Promise<string | null> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const payload = {
      title: f.title || null,
      description: f.description || null,
      price: Number(f.price) || null,
      negotiable: f.negotiable,
      category_id: f.category || null,
      condition: f.condition || null,
      images: f.imageUrls,
      city: f.city || null,
      location: f.location || null,
      updated_at: new Date().toISOString(),
    };

    if (draftAdId) {
      await supabase.from('ads').update(payload).eq('id', draftAdId).eq('seller_id', user.id);
      return draftAdId;
    } else {
      const { data, error } = await supabase.from('ads')
        .insert({ ...payload, seller_id: user.id, status: 'draft' })
        .select('id').single();
      if (!error && data) { setDraftAdId(data.id); return data.id; }
      return null;
    }
  }, [draftAdId]);

  // Load draft from DB (?draft=id) or localStorage
  useEffect(() => {
    const draftId = searchParams.get('draft');

    async function loadDraftFromDB(id: string) {
      const supabase = createClient();
      const { data } = await supabase.from('ads').select('*').eq('id', id).single();
      if (!data) return;
      setDraftAdId(id);
      setForm({
        category: (data.category_id as string) || '',
        title: (data.title as string) || '',
        condition: (data.condition as string) || '',
        description: (data.description as string) || '',
        imageFiles: [],
        imageUrls: (data.images as string[]) || [],
        price: data.price ? String(data.price) : '',
        negotiable: (data.negotiable as boolean) || false,
        city: (data.city as string) || '',
        location: (data.location as string) || '',
        phone: '',
      });
      // Open first incomplete step
      if (!data.category_id) setOpenStep(1);
      else if (!data.title || !data.condition || !data.description) setOpenStep(2);
      else if (!((data.images as string[])?.length >= 3)) setOpenStep(3);
      else setOpenStep(4);
    }

    if (draftId) {
      loadDraftFromDB(draftId);
    } else {
      const draft = loadDraftFromStorage();
      if (draft && hasMeaningfulData({ ...draft, imageFiles: [] })) {
        setDraftBanner(true);
      }
    }

    async function prefillFromProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('phone, city').eq('id', user.id).single();
      setForm(p => ({
        ...p,
        phone: p.phone || (data?.phone as string) || '',
        city: p.city || (data?.city as string) || '',
      }));
    }
    prefillFromProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intercept browser back button
  useEffect(() => {
    // Push a fake history entry so we can catch the back gesture
    window.history.pushState(null, '', window.location.pathname);

    const handlePopState = () => {
      if (hasMeaningfulData(formRef.current)) {
        // Re-push to keep user on this page while modal is shown
        window.history.pushState(null, '', window.location.pathname);
        leaveSourceRef.current = 'back';
        setShowLeaveModal(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Warn on browser close/refresh if form has data
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasMeaningfulData(form)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [form]);

  const handleSaveDraft = useCallback(async () => {
    saveDraftToStorage(form);
    await saveDraftToDB(form);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }, [form, saveDraftToDB]);

  const handleLoadDraft = () => {
    const draft = loadDraftFromStorage();
    if (!draft) return;
    setForm({ ...EMPTY_FORM, ...draft });
    setDraftBanner(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setDraftBanner(false);
  };

  // Navigate away after modal confirm (accounts for fake history entry)
  const doLeave = useCallback(() => {
    if (leaveSourceRef.current === 'back') {
      // We pushed 2 fake entries: the initial one + the one during intercept
      // go(-2) lands on the real previous page
      window.history.go(-2);
    } else {
      router.back();
    }
  }, [router]);

  // X / leave button clicked
  const handleLeave = () => {
    if (hasMeaningfulData(form)) {
      leaveSourceRef.current = 'button';
      setShowLeaveModal(true);
    } else {
      clearDraft();
      router.back();
    }
  };

  const handleModalSaveDraft = async () => {
    saveDraftToStorage(form);
    await saveDraftToDB(form);
    setShowLeaveModal(false);
    doLeave();
  };

  const handleModalDiscard = async () => {
    clearDraft();
    // Delete from DB if saved
    if (draftAdId) {
      const supabase = createClient();
      await supabase.from('ads').delete().eq('id', draftAdId);
    }
    setShowLeaveModal(false);
    doLeave();
  };

  const isComplete = (s: number): boolean => {
    if (s === 1) return !!form.category;
    if (s === 2) return form.title.length >= 5 && !!form.condition && form.description.length >= 20;
    if (s === 3) return form.imageUrls.length >= 3;
    if (s === 4) return Number(form.price) > 0 && !!form.city;
    return false;
  };

  const validateStep = (s: number): boolean => {
    const e: typeof errors = {};
    if (s === 1 && !form.category) e.category = 'Hopa, alege o categorie 🙂';
    if (s === 2) {
      if (!form.title || form.title.length < 5) e.title = 'Titlul trebuie să aibă cel puțin 5 caractere.';
      if (!form.condition) e.condition = 'Selectează starea produsului.';
      if (!form.description || form.description.length < 20) e.description = 'Adaugă o descriere mai detaliată (min. 20 caractere).';
    }
    if (s === 3 && form.imageUrls.length < 3) e.images = 'Adaugă cel puțin 3 fotografii 📸';
    if (s === 4) {
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Introdu un preț valid.';
      if (!form.city) e.city = 'Alege un oraș.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const toggleStep = (s: number) => {
    setVisited(prev => new Set([...prev, s]));
    setOpenStep(prev => (prev === s ? null : s));
  };

  const continueStep = (s: number) => {
    if (!validateStep(s)) return;
    setVisited(prev => new Set([...prev, s]));
    const next = s < 4 ? s + 1 : null;
    setOpenStep(next);
  };

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

  const removeImage = (i: number) => {
    set('imageUrls', form.imageUrls.filter((_, idx) => idx !== i));
    setPreviewIdx(p => (p >= i && p > 0 ? p - 1 : p));
  };

  const handlePublish = async () => {
    if (!validateStep(4)) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?redirect=/postare');
      return;
    }

    const adPayload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      negotiable: form.negotiable,
      category_id: form.category,
      condition: form.condition,
      images: form.imageUrls,
      city: form.city,
      location: form.location || null,
      status: 'activ',
      updated_at: new Date().toISOString(),
    };

    let adId: string;
    if (draftAdId) {
      const { error } = await supabase.from('ads').update(adPayload).eq('id', draftAdId).eq('seller_id', user.id);
      if (error) { setErrors({ submit: error.message }); setLoading(false); return; }
      adId = draftAdId;
    } else {
      const { data, error } = await supabase.from('ads')
        .insert({ ...adPayload, seller_id: user.id })
        .select('id').single();
      if (error) { setErrors({ submit: error.message }); setLoading(false); return; }
      adId = data.id;
    }

    if (form.phone) {
      await supabase.from('profiles').update({ phone: form.phone }).eq('id', user.id);
    }

    clearDraft();
    setPublishedId(adId);
    setLoading(false);
  };

  if (publishedId) {
    return (
      <>
        <TopBar onLeave={handleLeave} onSaveDraft={handleSaveDraft} hasDraft={false} draftSaved={false} />
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
              <Button onClick={() => { setForm(EMPTY_FORM); setOpenStep(1); setVisited(new Set()); setPublishedId(null); }} variant="secondary" size="lg">
                Postează altul
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const completedCount = [1, 2, 3, 4].filter(isComplete).length;
  const progress = (completedCount / 4) * 100;
  const cat = CATEGORIES.find(c => c.id === form.category);

  return (
    <>
      {/* Leave / save-draft modal */}
      {showLeaveModal && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-[2px] animate-fade-in" />
          <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                    <BookmarkCheck className="w-5 h-5 text-slate-700" />
                  </div>
                  <h2 className="font-bold text-slate-900 text-lg leading-tight">Salvezi progresul?</h2>
                </div>
                <button onClick={() => setShowLeaveModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition text-slate-400 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Ciorna ta va fi salvată. Poți continua oricând de unde ai rămas.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleModalSaveDraft}
                  className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition">
                  Salvează ciornă
                </button>
                <button
                  onClick={handleModalDiscard}
                  className="w-full py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" /> Renunță la anunț
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Top bar ── */}
      <TopBar
        onLeave={handleLeave}
        onSaveDraft={handleSaveDraft}
        hasDraft={hasMeaningfulData(form)}
        draftSaved={draftSaved}
      />

      {/* ── Progress bar ── */}
      <div className="w-full h-2 bg-slate-100 shrink-0">
        <div
          className="h-full bg-[#2563EB] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Main split ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: scrollable form */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[560px] mx-auto px-6 sm:px-10 py-10">

            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-900">Postează anunțul tău</h1>
              <p className="text-slate-500 text-sm mt-1">Gratuit · Sub 2 minute</p>
            </div>

            {/* Draft resume banner */}
            {draftBanner && (
              <div className="mb-5 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3.5">
                <RotateCcw className="w-5 h-5 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-900">Ai o ciornă salvată</p>
                  <p className="text-xs text-blue-600 mt-0.5">Continui de unde ai rămas?</p>
                </div>
                <button
                  onClick={handleLoadDraft}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shrink-0">
                  Continuă
                </button>
                <button
                  onClick={handleDiscardDraft}
                  className="p-1.5 rounded-xl text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Accordion */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {SECTIONS.map(s => (
                <div key={s.id}>
                  <button
                    onClick={() => toggleStep(s.id)}
                    className="flex items-center gap-4 w-full px-6 py-4 text-left hover:bg-slate-50/70 transition-colors"
                  >
                    {isComplete(s.id) ? (
                      <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-sm leading-none">{s.id}</span>
                      </div>
                    )}
                    <p className="flex-1 font-bold text-slate-900 text-sm">{s.label}</p>
                    {visited.has(s.id) && !isComplete(s.id) && (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mr-1">
                        Incomplet
                      </span>
                    )}
                    <ChevronDown className={cn('w-5 h-5 text-slate-400 transition-transform shrink-0', openStep === s.id && 'rotate-180')} />
                  </button>

                  {openStep === s.id && (
                    <div className="px-6 pb-6 pt-2">

                      {/* Step 1: Category */}
                      {s.id === 1 && (
                        <div>
                          {errors.category && <ErrorMsg msg={errors.category} className="mb-3" />}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {CATEGORIES.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => { set('category', c.id); setErrors({}); }}
                                className={cn(
                                  'p-4 rounded-2xl border-2 text-left transition-all',
                                  form.category === c.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                )}
                              >
                                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2.5', c.color)}>
                                  <span className="text-lg">{CAT_ICONS[c.icon] ?? '📦'}</span>
                                </div>
                                <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step 2: Details */}
                      {s.id === 2 && (
                        <div className="flex flex-col gap-5">
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
                            <div className="grid grid-cols-1 gap-2 mt-2">
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
                      {s.id === 3 && (
                        <div>
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
                      {s.id === 4 && (
                        <div className="flex flex-col gap-5">
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

                      {s.id < 4 && (
                        <button
                          onClick={() => continueStep(s.id)}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold mt-5 transition-colors text-sm"
                        >
                          Continuă
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Publish button */}
            <button
              onClick={handlePublish}
              disabled={loading}
              className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-2xl text-base transition-colors mt-6 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {loading ? 'Se publică...' : 'Publică anunțul'}
            </button>

          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-slate-100 shrink-0" />

        {/* RIGHT: Preview (desktop only) */}
        <div className="hidden lg:flex flex-1 overflow-y-auto bg-[#F5F7FA]">
          <div className="w-full px-10 py-10">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Previzualizare anunț</p>
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <div className="aspect-[4/3] bg-slate-100 relative">
                {form.imageUrls[previewIdx] ? (
                  <img src={form.imageUrls[previewIdx]} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
                    <ImagePlus className="w-16 h-16" />
                    <span className="text-sm">Nicio fotografie</span>
                  </div>
                )}
                {form.condition && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm">
                    {CONDITION_LABELS[form.condition]}
                  </span>
                )}
                {form.negotiable && (
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                    Negociabil
                  </span>
                )}
              </div>

              {form.imageUrls.length > 0 && (
                <div className="flex gap-2 px-4 py-3 border-b border-slate-100 overflow-x-auto">
                  {form.imageUrls.slice(0, 8).map((url, i) => (
                    <button key={i} onClick={() => setPreviewIdx(i)}
                      className={cn(
                        'w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all',
                        previewIdx === i ? 'border-[#2563EB] shadow-sm' : 'border-transparent hover:border-slate-300'
                      )}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="p-6">
                <p className={cn('font-bold text-slate-900 text-xl leading-snug', !form.title && 'text-slate-300 font-normal text-lg')}>
                  {form.title || 'Titlul anunțului...'}
                </p>
                <p className={cn('text-3xl font-black mt-2', form.price ? 'text-[#2563EB]' : 'text-slate-200')}>
                  {form.price ? `${Number(form.price).toLocaleString('ro-RO')} RON` : '— RON'}
                </p>
                <div className="flex items-center gap-4 mt-4 text-sm text-slate-500 flex-wrap">
                  {cat && <span className="flex items-center gap-1.5">{CAT_ICONS[cat.icon] ?? '📦'} {cat.name}</span>}
                  {form.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {form.city}
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

function TopBar({ onLeave, onSaveDraft, hasDraft, draftSaved }: {
  onLeave: () => void;
  onSaveDraft: () => void;
  hasDraft: boolean;
  draftSaved: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-6 h-14 border-b border-slate-100 shrink-0 bg-white">
      <Link href="/" className="text-lg font-black text-slate-900 tracking-tight">
        e<span className="text-[#2563EB]">postat</span><span className="text-slate-400 font-normal">.ro</span>
      </Link>
      <div className="flex items-center gap-2">
        {hasDraft && (
          <button
            onClick={onSaveDraft}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition',
              draftSaved
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <BookmarkCheck className="w-4 h-4" />
            {draftSaved ? 'Salvat!' : 'Salvează ciornă'}
          </button>
        )}
        <button
          onClick={onLeave}
          aria-label="Închide"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
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
