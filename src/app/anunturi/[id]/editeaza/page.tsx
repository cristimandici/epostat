'use client';
import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Upload, AlertCircle, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { CATEGORIES } from '@/lib/data';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const CONDITIONS = [
  { value: 'nou', label: 'Nou' },
  { value: 'ca-nou', label: 'Ca nou' },
  { value: 'buna-stare', label: 'Stare bună' },
  { value: 'uzura-normala', label: 'Uzură normală' },
  { value: 'necesita-reparatii', label: 'Necesită reparații' },
];

const CITIES = ['Alba Iulia', 'Alexandria', 'Arad', 'Bacău', 'Baia Mare', 'Bistrița', 'Botoșani', 'Brăila', 'Brașov', 'București', 'Buzău', 'Călărași', 'Cluj-Napoca', 'Constanța', 'Craiova', 'Deva', 'Drobeta-Turnu Severin', 'Focșani', 'Galați', 'Giurgiu', 'Iași', 'Ilfov', 'Miercurea Ciuc', 'Oradea', 'Piatra Neamț', 'Pitești', 'Ploiești', 'Râmnicu Vâlcea', 'Reșița', 'Satu Mare', 'Sfântu Gheorghe', 'Sibiu', 'Slatina', 'Slobozia', 'Suceava', 'Târgu Jiu', 'Târgu Mureș', 'Târgoviște', 'Timișoara', 'Tulcea', 'Vaslui', 'Zalău'];

export default function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: ad, error } = await supabase.from('ads').select('*').eq('id', id).single();
      if (error || !ad) { router.push('/profil'); return; }
      if (ad.seller_id !== user.id) { router.push('/profil'); return; }

      setTitle(ad.title || '');
      setDescription(ad.description || '');
      setCondition(ad.condition || '');
      setCategory(ad.category_id || '');
      setPrice(String(ad.price || ''));
      setNegotiable(ad.negotiable || false);
      setCity(ad.city || '');
      setLocation(ad.location || '');
      setImageUrls(ad.images || []);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 10 - imageUrls.length;
    const toProcess = files.slice(0, remaining);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (let i = 0; i < toProcess.length; i++) {
      const file = toProcess[i];
      setUploadingIdx(imageUrls.length + i);
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('ad-images').upload(path, file, { cacheControl: '3600', upsert: false });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('ad-images').getPublicUrl(path);
        setImageUrls(prev => [...prev, publicUrl]);
      }
    }
    setUploadingIdx(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title || title.length < 5) e.title = 'Titlul trebuie să aibă cel puțin 5 caractere.';
    if (!condition) e.condition = 'Selectează starea produsului.';
    if (!description || description.length < 20) e.description = 'Adaugă o descriere mai detaliată (min. 20 caractere).';
    if (imageUrls.length === 0) e.images = 'Adaugă cel puțin o fotografie.';
    if (!price || isNaN(Number(price)) || Number(price) <= 0) e.price = 'Introdu un preț valid.';
    if (!city) e.city = 'Alege un oraș.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const { error } = await supabase.from('ads').update({
      title,
      description,
      condition,
      category_id: category,
      price: Number(price),
      negotiable,
      city,
      location: location || null,
      images: imageUrls,
    }).eq('id', id);

    if (error) {
      setErrors({ submit: `Eroare la salvare: ${error.message}` });
      setSaving(false);
      return;
    }
    router.push(`/anunturi/${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">Editează anunțul</h1>
          <p className="text-slate-500 text-sm">Modifică detaliile și salvează</p>
        </div>
        <Button variant="secondary" onClick={() => router.back()} className="gap-1.5">
          <X className="w-4 h-4" /> Anulează
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Categorie</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={cn('py-2 px-3 rounded-xl border-2 text-sm font-medium text-left transition-all',
                  category === cat.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300')}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Titlu <span className="text-red-400">*</span></label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={80}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          {errors.title && <Err msg={errors.title} />}
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Stare produs <span className="text-red-400">*</span></label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map(c => (
              <button key={c.value} onClick={() => setCondition(c.value)}
                className={cn('px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-all',
                  condition === c.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300')}>
                {c.label}
              </button>
            ))}
          </div>
          {errors.condition && <Err msg={errors.condition} />}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Descriere <span className="text-red-400">*</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} maxLength={2000}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          <div className="flex justify-between mt-1">
            {errors.description ? <Err msg={errors.description} /> : <span />}
            <span className="text-xs text-slate-400">{description.length}/2000</span>
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Fotografii <span className="text-red-400">*</span></label>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileChange} />
          <div className="grid grid-cols-4 gap-2 mb-2">
            {imageUrls.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src={img} alt="" className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute top-1 left-1 px-1 py-0.5 rounded text-xs font-bold bg-blue-600 text-white">1</span>}
                <button onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition text-xs">
                  ×
                </button>
              </div>
            ))}
            {uploadingIdx !== null && (
              <div className="aspect-square rounded-xl border-2 border-blue-300 bg-blue-50 flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
            )}
            {imageUrls.length < 10 && uploadingIdx === null && (
              <button onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 transition-all text-xs gap-1">
                <Upload className="w-5 h-5" />
                Adaugă
              </button>
            )}
          </div>
          {errors.images && <Err msg={errors.images} />}
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Preț (RON) <span className="text-red-400">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">RON</span>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} min={1}
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            {errors.price && <Err msg={errors.price} />}
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={cn('relative w-10 h-5 rounded-full transition-colors', negotiable ? 'bg-blue-600' : 'bg-slate-300')}>
                <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', negotiable ? 'translate-x-5' : 'translate-x-0.5')} />
                <input type="checkbox" className="sr-only" checked={negotiable} onChange={e => setNegotiable(e.target.checked)} />
              </div>
              <span className="text-sm font-medium text-slate-700">Negociabil</span>
            </label>
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Oraș <span className="text-red-400">*</span></label>
            <select value={city} onChange={e => setCity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selectează...</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
            {errors.city && <Err msg={errors.city} />}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cartier / zonă</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Florești"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
        </div>

        {errors.submit && <Err msg={errors.submit} />}

        <div className="pt-2 border-t border-slate-100 flex gap-3">
          <Button variant="secondary" onClick={() => router.back()} className="gap-1.5">
            <X className="w-4 h-4" /> Anulează
          </Button>
          <Button onClick={handleSave} loading={saving} variant="accent" size="lg" className="gap-2 flex-1">
            <Sparkles className="w-4 h-4" /> Salvează modificările
          </Button>
        </div>
      </div>
    </div>
  );
}

function Err({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {msg}
    </p>
  );
}
