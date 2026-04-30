'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Search, Bell, MessageCircle, User, Menu, X, Plus, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group" aria-label="epostat.ro – Acasă">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 14L8 6L12 11L15 8L17 14H4Z" fill="white" opacity="0.9" />
                <circle cx="15" cy="5" r="2.5" fill="#F59E0B" />
              </svg>
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight hidden sm:block">
              e<span className="text-[#2563EB]">postat</span><span className="text-slate-400 font-normal">.ro</span>
            </span>
          </Link>

          {/* Search bar – desktop */}
          <form
            onSubmit={(e) => { e.preventDefault(); if (searchQuery) window.location.href = `/anunturi?q=${encodeURIComponent(searchQuery)}`; }}
            className="hidden md:flex flex-1 max-w-xl mx-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F59E0B]" aria-label="Ai mesaje necitite" />
            </Link>
            <Link
              href="/oferte"
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
              aria-label="Notificări"
            >
              <Bell className="w-5 h-5" />
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
          <form onSubmit={(e) => { e.preventDefault(); if (searchQuery) window.location.href = `/anunturi?q=${encodeURIComponent(searchQuery)}`; }}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              { href: '/mesaje', label: 'Mesaje', icon: <MessageCircle className="w-4 h-4" /> },
              { href: '/oferte', label: 'Ofertele mele', icon: <Bell className="w-4 h-4" /> },
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
