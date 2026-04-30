'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BadgeCheck, Star, Edit3, Package, TrendingDown,
  Heart, ChevronRight, Plus, ShieldCheck, Phone, Mail,
  Save, X, LogOut, Upload, Clock, Pencil, Trash2, CheckCircle2,
} from 'lucide-react';
import AdCard from '@/components/ads/AdCard';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, timeAgo } from '@/lib/data';
import { Ad } from '@/lib/types';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'active', label: 'Active', icon: <Package className="w-4 h-4" /> },
  { id: 'offers', label: 'Oferte', icon: <TrendingDown className="w-4 h-4" /> },
  { id: 'favorites', label: 'Favorite', icon: <Heart className="w-4 h-4" /> },
  { id: 'sold', label: 'Vândute', icon: <BadgeCheck className="w-4 h-4" /> },
];

const OFFER_STATUS: Record<string, { label: string; color: string }> = {
  asteptare: { label: 'În așteptare', color: 'bg-yellow-100 text-yellow-700' },
  acceptata: { label: 'Acceptată', color: 'bg-green-100 text-green-700' },
  refuzata: { label: 'Refuzată', color: 'bg-red-100 text-red-700' },
  contraoferta: { label: 'Contraofertă primită', color: 'bg-blue-100 text-blue-700' },
};

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&auto=format';

interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  city?: string;
  rating: number;
  review_count: number;
  verified: boolean;
}

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
    },
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState('');
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [soldAds, setSoldAds] = useState<Ad[]>([]);
  const [favorites, setFavorites] = useState<Ad[]>([]);
  const [offers, setOffers] = useState<Array<{ id: string; status: string; current_amount: number; original_price: number; created_at: string; ads: { title: string; images: string[] } | null }>>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'none' | 'pending' | 'verified'>('none');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const verifyInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [adActionLoading, setAdActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login?redirect=/profil'); return; }
      setUserId(user.id);

      const [profileRes, adsRes, favIdsRes, offersRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('ads').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
        supabase.from('favorites').select('ad_id').eq('user_id', user.id),
        supabase.from('offers')
          .select('*, ads(title, images)')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('created_at', { ascending: false }),
      ]);

      const prof = profileRes.data as Profile | null;
      setProfile(prof);
      setEditForm({
        name: prof?.name || '',
        phone: prof?.phone || '',
        city: prof?.city || '',
      });

      if (prof?.verified) {
        setVerifyStatus('verified');
      } else if (localStorage.getItem(`epostat_id_pending_${user.id}`) === 'true') {
        setVerifyStatus('pending');
      }

      const sellerMeta = {
        seller_id: user.id,
        seller_name: prof?.name,
        seller_avatar: prof?.avatar_url,
        seller_rating: prof?.rating,
        seller_review_count: prof?.review_count,
        seller_verified: prof?.verified,
      };

      const allAds = (adsRes.data || []) as Record<string, unknown>[];
      setMyAds(allAds.filter(a => a.status === 'activ').map(a => mapAd({ ...a, ...sellerMeta })));
      setSoldAds(allAds.filter(a => a.status === 'vandut').map(a => mapAd({ ...a, ...sellerMeta })));

      const adIds = ((favIdsRes.data || []) as Record<string, unknown>[]).map(f => f.ad_id as string);
      if (adIds.length > 0) {
        const { data: favAds } = await supabase.from('ads').select('*').in('id', adIds);
        const favSellerIds = [...new Set((favAds || []).map(a => a.seller_id as string))];
        const { data: favProfiles } = favSellerIds.length > 0
          ? await supabase.from('profiles').select('id, name, avatar_url, rating, review_count, verified').in('id', favSellerIds)
          : { data: [] };
        const favProfMap = Object.fromEntries((favProfiles || []).map(p => [p.id, p]));
        setFavorites((favAds || []).map(a => {
          const sp = favProfMap[a.seller_id as string];
          return mapAd({ ...a, seller_id: a.seller_id, seller_name: sp?.name ?? 'Utilizator', seller_avatar: sp?.avatar_url ?? null, seller_rating: sp?.rating ?? 5, seller_review_count: sp?.review_count ?? 0, seller_verified: sp?.verified ?? false } as Record<string, unknown>);
        }));
      }

      setOffers((offersRes.data || []) as typeof offers);
      setLoading(false);
    }
    load();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await supabase.from('profiles').update({
      name: editForm.name,
      phone: editForm.phone || null,
      city: editForm.city || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    setProfile(p => p ? { ...p, ...editForm } : p);
    setEditing(false);
    setSaving(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleVerifyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVerifyLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setVerifyLoading(false); return; }
    const ext = file.name.split('.').pop();
    const path = `${user.id}/id.${ext}`;
    const { error } = await supabase.storage.from('verification-docs').upload(path, file, { upsert: true });
    if (!error) {
      localStorage.setItem(`epostat_id_pending_${user.id}`, 'true');
      setVerifyStatus('pending');
      setVerifyOpen(false);
    }
    setVerifyLoading(false);
    if (verifyInputRef.current) verifyInputRef.current.value = '';
  };

  const handleMarkSold = async (adId: string) => {
    setAdActionLoading(adId + '_sold');
    await supabase.from('ads').update({ status: 'vandut' }).eq('id', adId);
    const ad = myAds.find(a => a.id === adId);
    if (ad) {
      setMyAds(prev => prev.filter(a => a.id !== adId));
      setSoldAds(prev => [{ ...ad, status: 'vandut' as Ad['status'] }, ...prev]);
    }
    setAdActionLoading(null);
  };

  const handleDelete = async (adId: string) => {
    setAdActionLoading(adId + '_delete');
    await supabase.from('ads').delete().eq('id', adId);
    setMyAds(prev => prev.filter(a => a.id !== adId));
    setConfirmDeleteId(null);
    setAdActionLoading(null);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const emailVerified = true;
  const phoneVerified = !!(profile?.phone);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 mb-6 shadow-sm">
        {editing ? (
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-slate-900">Editează profilul</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nume</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Telefon</label>
                <input type="tel" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="07xx xxx xxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Oraș</label>
                <input type="text" value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="Ex: București"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveProfile} loading={saving} className="gap-1.5">
                <Save className="w-4 h-4" /> Salvează
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)} className="gap-1.5">
                <X className="w-4 h-4" /> Anulează
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name}
                    className="w-20 h-20 rounded-2xl border-2 border-slate-200 object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black">
                    {profile?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                {!!profile?.verified && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow">
                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900">{profile?.name}</h1>
                  {!!profile?.verified && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verificat
                    </span>
                  )}
                </div>
                {profile?.city && <p className="text-slate-500 text-sm mt-0.5">{profile.city}</p>}

                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                    <span className="font-bold text-slate-900">{Number(profile?.rating || 5).toFixed(1)}</span>
                    <span className="text-slate-500">({profile?.review_count || 0} recenzii)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span>{myAds.length + soldAds.length} anunțuri publicate</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                  <Edit3 className="w-4 h-4" /> Editează
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-red-500 hover:bg-red-50">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-sm', emailVerified ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-500')}>
                <Mail className="w-4 h-4" />
                <span className="font-medium">Email verificat</span>
                {emailVerified ? <BadgeCheck className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />}
              </div>
              <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-sm', phoneVerified ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-500')}>
                <Phone className="w-4 h-4" />
                <span className="font-medium">Telefon adăugat</span>
                {phoneVerified ? <BadgeCheck className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />}
              </div>
              <button
                onClick={() => { if (verifyStatus === 'none') setVerifyOpen(v => !v); }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition',
                  verifyStatus === 'verified' ? 'bg-green-50 text-green-700' :
                  verifyStatus === 'pending' ? 'bg-amber-50 text-amber-700' :
                  'bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer'
                )}>
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="font-medium">
                  {verifyStatus === 'verified' ? 'Identitate verificată' :
                   verifyStatus === 'pending' ? 'În verificare' :
                   'Verifică identitatea'}
                </span>
                {verifyStatus === 'verified' ? <BadgeCheck className="w-4 h-4 ml-auto" /> :
                 verifyStatus === 'pending' ? <Clock className="w-4 h-4 ml-auto" /> :
                 <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />}
              </button>
            </div>

            {/* Identity verification panel */}
            {verifyOpen && verifyStatus === 'none' && (
              <div className="mt-4 p-4 rounded-2xl border border-blue-200 bg-blue-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Verifică-ți identitatea</p>
                    <p className="text-xs text-slate-500 mt-0.5">Încarcă o fotografie clară a actului de identitate (față). Vom verifica în maxim 24h.</p>
                  </div>
                  <button onClick={() => setVerifyOpen(false)} className="text-slate-400 hover:text-slate-600 ml-3 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  ref={verifyInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleVerifyUpload}
                />
                <button
                  onClick={() => verifyInputRef.current?.click()}
                  disabled={verifyLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {verifyLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {verifyLoading ? 'Se încarcă...' : 'Alege document'}
                </button>
                <p className="text-xs text-slate-400 mt-2">JPG, PNG sau WebP · Max 10MB · Datele sunt confidențiale</p>
              </div>
            )}

            {verifyStatus === 'pending' && (
              <div className="mt-4 p-3 rounded-2xl border border-amber-200 bg-amber-50 flex items-center gap-3 text-sm text-amber-700">
                <Clock className="w-4 h-4 shrink-0" />
                <span className="flex-1">Documentul tău a fost trimis. Vom verifica identitatea în maxim 24 de ore.</span>
                <button
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) localStorage.removeItem(`epostat_id_pending_${user.id}`);
                    setVerifyStatus('none');
                    setVerifyOpen(true);
                  }}
                  className="text-xs font-semibold underline hover:no-underline shrink-0">
                  Retrimite
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 mb-4 p-1.5 flex gap-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all',
              tab === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Active ads */}
      {tab === 'active' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-500"><strong className="text-slate-900">{myAds.length}</strong> anunțuri active</p>
            <Link href="/postare">
              <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Anunț nou</Button>
            </Link>
          </div>
          {myAds.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {myAds.map(ad => (
                <div key={ad.id} className="flex flex-col gap-2">
                  <AdCard
                    ad={ad}
                    favorited={favorites.some(f => f.id === ad.id)}
                    onFavoriteToggle={(id, nowFav) => {
                      if (nowFav) setFavorites(prev => prev.some(f => f.id === id) ? prev : [...prev, ad]);
                      else setFavorites(prev => prev.filter(f => f.id !== id));
                    }}
                  />
                  {confirmDeleteId === ad.id ? (
                    <div className="flex gap-1.5 px-1">
                      <span className="text-xs text-slate-500 flex-1 flex items-center">Sigur ștergi?</span>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        disabled={adActionLoading === ad.id + '_delete'}
                        className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition disabled:opacity-50">
                        {adActionLoading === ad.id + '_delete' ? '...' : 'Șterge'}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded-lg bg-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-300 transition">
                        Nu
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 px-1">
                      <Link href={`/anunturi/${ad.id}/editeaza`} className="flex-1">
                        <button className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition">
                          <Pencil className="w-3 h-3" /> Editează
                        </button>
                      </Link>
                      <button
                        onClick={() => handleMarkSold(ad.id)}
                        disabled={adActionLoading === ad.id + '_sold'}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-green-200 text-green-700 text-xs font-medium hover:bg-green-50 transition disabled:opacity-50">
                        <CheckCircle2 className="w-3 h-3" />
                        {adActionLoading === ad.id + '_sold' ? '...' : 'Vândut'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(ad.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState emoji="📦" title="Nu ai niciun anunț activ"
              desc="Postează primul tău anunț gratuit și ajunge la mii de cumpărători!"
              cta="Postează primul anunț" href="/postare" />
          )}
        </div>
      )}

      {/* Offers */}
      {tab === 'offers' && (
        <div className="flex flex-col gap-3">
          {offers.length > 0 ? offers.map((offer) => {
            const status = OFFER_STATUS[offer.status] || OFFER_STATUS.asteptare;
            const adImage = offer.ads?.images?.[0] || PLACEHOLDER;
            return (
              <div key={offer.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 flex gap-4">
                <img src={adImage} alt={offer.ads?.title || ''} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm line-clamp-1">{offer.ads?.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{timeAgo(offer.created_at)}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-lg font-black text-[#2563EB]">{formatPrice(Number(offer.current_amount))}</span>
                    <span className="text-xs text-slate-400 line-through">{formatPrice(Number(offer.original_price))}</span>
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', status.color)}>{status.label}</span>
                  </div>
                </div>
                <Link href="/oferte" className="shrink-0 self-center">
                  <Button variant="outline" size="sm">Detalii</Button>
                </Link>
              </div>
            );
          }) : (
            <EmptyState emoji="💬" title="Nicio ofertă trimisă"
              desc="Când faci o ofertă pentru un anunț, o vei vedea aici."
              cta="Caută anunțuri" href="/anunturi" />
          )}
        </div>
      )}

      {/* Favorites */}
      {tab === 'favorites' && (
        <div>
          {favorites.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {favorites.map(ad => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  favorited
                  onFavoriteToggle={(id, nowFav) => {
                    if (!nowFav) setFavorites(prev => prev.filter(a => a.id !== id));
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState emoji="❤️" title="Nu ai anunțuri favorite"
              desc="Salvează anunțuri apăsând pe inimioara din fiecare card."
              cta="Explorează anunțuri" href="/anunturi" />
          )}
        </div>
      )}

      {/* Sold */}
      {tab === 'sold' && (
        soldAds.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {soldAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
          </div>
        ) : (
          <EmptyState emoji="🎉" title="Niciun produs vândut încă"
            desc="Marchează anunțuri ca vândute din pagina fiecărui anunț."
            cta="Postează un anunț" href="/postare" />
        )
      )}
    </div>
  );
}

function EmptyState({ emoji, title, desc, cta, href }: { emoji: string; title: string; desc: string; cta: string; href: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">{desc}</p>
      <Link href={href}><Button variant="primary">{cta}</Button></Link>
    </div>
  );
}
