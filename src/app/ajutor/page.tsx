'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, MessageCircle, Mail, Phone } from 'lucide-react';

const FAQS = [
  {
    category: 'Postare anunțuri',
    items: [
      { q: 'Cât costă să postez un anunț?', a: 'Postarea unui anunț pe epostat.ro este complet gratuită! Nu există taxe de listare, nu există comisioane ascunse. Doar publici și aștepți ofertele.' },
      { q: 'Câte fotografii pot adăuga?', a: 'Poți adăuga până la 10 fotografii per anunț. Recomandăm cel puțin 3 poze din unghiuri diferite pentru a atrage mai mulți cumpărători.' },
      { q: 'Cât timp rămâne activ un anunț?', a: 'Anunțurile rămân active timp de 60 de zile. Poți reactiva anunțul expirat oricând din secțiunea "Profilul meu".' },
      { q: 'Pot edita anunțul după publicare?', a: 'Da, poți edita titlul, descrierea, prețul și fotografiile oricând, atâta timp cât anunțul este activ.' },
    ],
  },
  {
    category: 'Sistemul de oferte',
    items: [
      { q: 'Cum funcționează sistemul de oferte?', a: 'Dacă un anunț are prețul marcat "Negociabil", cumpărătorii pot face oferte. Vânzătorul primește notificare și poate accepta, refuza sau contraferta. Ofertele expiră în 48 de ore dacă vânzătorul nu răspunde.' },
      { q: 'Pot anula o ofertă trimisă?', a: 'Da, poți anula o ofertă atâta timp cât aceasta nu a fost acceptată de vânzător. Mergi la "Ofertele mele" și apasă "Anulează".' },
      { q: 'Ce se întâmplă dacă oferta mea expiră?', a: 'Oferta expiră automat după 48 de ore fără răspuns din partea vânzătorului. Poți trimite o nouă ofertă dacă ești în continuare interesat.' },
    ],
  },
  {
    category: 'Cont și securitate',
    items: [
      { q: 'Cum îmi verific contul?', a: 'Verificarea se face în două etape: email (link de confirmare) și telefon (SMS cu cod). Un cont verificat primește un badge vizibil și inspiră mai multă încredere.' },
      { q: 'Ce fac dacă am uitat parola?', a: 'Apasă pe "Ai uitat parola?" de pe pagina de login și îți vom trimite un email cu instrucțiuni de resetare.' },
      { q: 'Cum raportez un anunț suspect?', a: 'Pe pagina fiecărui anunț există un buton de raportare (steag roșu). Echipa noastră revizuiește toate rapoartele în maxim 24 de ore.' },
    ],
  },
  {
    category: 'Plăți și tranzacții',
    items: [
      { q: 'epostat.ro facilitează plățile online?', a: 'Momentan, tranzacțiile se desfășoară direct între cumpărător și vânzător (cash, transfer bancar etc.). Lucrăm la integrarea unui sistem de plată sigur în platformă.' },
      { q: 'Cum mă protejez de escrocherii?', a: 'Nu transfera bani în avans fără să fi văzut produsul. Folosește întotdeauna mesajele din platformă și raportează orice comportament suspect. Nu da datele cardului bancii nimănui.' },
    ],
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = FAQS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) => !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-3">Centrul de ajutor</h1>
        <p className="text-slate-500 mb-6">Găsești răspunsuri la cele mai frecvente întrebări</p>
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută o întrebare..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      {/* FAQs */}
      <div className="flex flex-col gap-6 mb-12" id="faq">
        {filtered.map((cat) => (
          <div key={cat.category}>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{cat.category}</h2>
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              {cat.items.map((item, i) => {
                const id = `${cat.category}-${i}`;
                const isOpen = open === id;
                return (
                  <div key={id} className="border-b border-slate-100 last:border-0">
                    <button
                      className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition"
                      onClick={() => setOpen(isOpen ? null : id)}
                      aria-expanded={isOpen}
                    >
                      <span className="flex-1 font-semibold text-slate-900 text-sm leading-snug">{item.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <p className="text-4xl mb-3">🤷</p>
            <p>Nu am găsit răspunsuri pentru „{search}"</p>
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="bg-zinc-50 rounded-3xl border border-zinc-200 p-8 text-center">
        <h2 className="text-xl font-black text-slate-900 mb-2">Nu ai găsit răspunsul?</h2>
        <p className="text-slate-500 text-sm mb-6">Echipa noastră îți răspunde în maxim 24 de ore.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="mailto:contact@epostat.ro" className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:shadow-md transition">
            <Mail className="w-4 h-4 text-blue-600" /> contact@epostat.ro
          </a>
          <a href="tel:+40800000000" className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:shadow-md transition">
            <Phone className="w-4 h-4 text-green-600" /> 0800 000 000 (gratuit)
          </a>
        </div>
      </div>
    </div>
  );
}
