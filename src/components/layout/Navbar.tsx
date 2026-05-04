'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, Bell, MessageCircle, User, Menu, X, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingOffers, setPendingOffers] = useState(0);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const supabase = createClient();

    async function loadCounts(uid: string) {
      const [convRes, offersRes] = await Promise.all([
        supabase
          .from('conversations')
          .select('buyer_id, seller_id, buyer_unread, seller_unread')
          .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`),
        supabase
          .from('offers')
          .select('id, buyer_id, seller_id, status')
          .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
          .in('status', ['asteptare', 'contraoferta']),
      ]);

      if (convRes.data) {
        const total = convRes.data.reduce((sum, c) => {
          const mine = c.buyer_id === uid ? (c.buyer_unread || 0) : (c.seller_unread || 0);
          return sum + mine;
        }, 0);
        setUnreadMessages(total);
      }

      if (offersRes.data) {
        const actionable = offersRes.data.filter(o => {
          if (o.status === 'asteptare') return o.seller_id === uid;
          return true;
        });
        setPendingOffers(actionable.length);
      }
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      loadCounts(user.id);

      const channel = supabase
        .channel(`navbar_counts_${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadCounts(user.id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => loadCounts(user.id))
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }

    init();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 group" aria-label="epostat.ro – Acasă">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              e<span className="text-[#2563EB]">postat</span><span className="text-slate-400 font-normal hidden sm:inline">.ro</span>
            </span>
          </Link>

          {/* Search bar – desktop */}
          <form
            onSubmit={e => { e.preventDefault(); if (searchQuery) window.location.href = `/anunturi?q=${encodeURIComponent(searchQuery)}`; }}
            className="hidden md:flex flex-1 max-w-xl mx-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Ce cauți? ex: iPhone, bicicletă, canapea..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition"
                aria-label="Caută anunțuri"
              />
            </div>
            <button
              type="submit"
              className="ml-2 px-4 py-2.5 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] transition"
            >
              Caută
            </button>
          </form>

          {/* Nav icons */}
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/mesaje"
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition relative"
              aria-label="Mesaje"
            >
              <MessageCircle className="w-5 h-5" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>
            <Link
              href="/oferte"
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition relative"
              aria-label="Oferte"
            >
              <Bell className="w-5 h-5" />
              {pendingOffers > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#F59E0B] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {pendingOffers > 9 ? '9+' : pendingOffers}
                </span>
              )}
            </Link>
            <Link
              href="/profil"
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
              aria-label="Profilul meu"
            >
              <User className="w-5 h-5" />
            </Link>

            <Link href="/postare" className="ml-1">
              <Button variant="accent" size="sm" className="gap-1.5 rounded-xl">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Postează anunț</span>
                <span className="sm:hidden">Anunț</span>
              </Button>
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="sm:hidden ml-1 w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Meniu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <form onSubmit={e => { e.preventDefault(); if (searchQuery) window.location.href = `/anunturi?q=${encodeURIComponent(searchQuery)}`; }}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Ce cauți astăzi?"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white animate-slide-in">
          <nav className="flex flex-col py-2">
            {[
              { href: '/profil', label: 'Profilul meu', icon: <User className="w-4 h-4" /> },
              {
                href: '/mesaje', label: 'Mesaje', icon: (
                  <span className="relative">
                    <MessageCircle className="w-4 h-4" />
                    {unreadMessages > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">{unreadMessages > 9 ? '9+' : unreadMessages}</span>}
                  </span>
                )
              },
              {
                href: '/oferte', label: 'Ofertele mele', icon: (
                  <span className="relative">
                    <Bell className="w-4 h-4" />
                    {pendingOffers > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#F59E0B] text-white text-[9px] font-bold flex items-center justify-center">{pendingOffers > 9 ? '9+' : pendingOffers}</span>}
                  </span>
                )
              },
            ].map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-slate-400">{icon}</span>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
