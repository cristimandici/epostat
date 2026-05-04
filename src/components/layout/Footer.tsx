import Link from 'next/link';
import { Mail, Phone, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-black text-white tracking-tight">
                e<span className="text-blue-400">postat</span><span className="text-slate-500 font-normal">.ro</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Piața ta online de anunțuri — simplă, rapidă și de încredere. Cumpără, vinde și negociează în câteva clicuri.
            </p>
            <div className="flex flex-col gap-2 text-sm text-slate-400">
              <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> contact@epostat.ro</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> București, România</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Marketplace</h3>
            <ul className="flex flex-col gap-3 text-sm">
              {[
                { href: '/anunturi', label: 'Toate anunțurile' },
                { href: '/anunturi?cat=electronice', label: 'Electronice' },
                { href: '/anunturi?cat=auto', label: 'Auto & Moto' },
                { href: '/anunturi?cat=imobiliare', label: 'Imobiliare' },
                { href: '/postare', label: 'Postează anunț' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Contul meu</h3>
            <ul className="flex flex-col gap-3 text-sm">
              {[
                { href: '/login', label: 'Conectează-te' },
                { href: '/inregistrare', label: 'Creează cont' },
                { href: '/profil', label: 'Profil' },
                { href: '/oferte', label: 'Ofertele mele' },
                { href: '/mesaje', label: 'Mesaje' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Informații</h3>
            <ul className="flex flex-col gap-3 text-sm">
              {[
                { href: '/cum-functioneaza', label: 'Cum funcționează' },
                { href: '/despre', label: 'Despre noi' },
                { href: '/ajutor', label: 'Centru de ajutor' },
                { href: '/ajutor#faq', label: 'Întrebări frecvente' },
                { href: '/termeni', label: 'Termeni și condiții' },
                { href: '/confidentialitate', label: 'Politica de confidențialitate' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <p>© 2025 epostat.ro — Toate drepturile rezervate</p>
          <p className="flex items-center gap-1">
            Făcut cu <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" /> în România
          </p>
        </div>
      </div>
    </footer>
  );
}
