import Link from 'next/link';
import { Plus, Search, TrendingDown, Check, ShieldCheck, Star, Zap, ArrowRight } from 'lucide-react';

const STEPS_SELL = [
  { icon: <Plus className="w-6 h-6 text-white" />, color: 'bg-blue-600', step: '1', title: 'Creează un cont', desc: 'Înregistrare rapidă cu email, Google sau Facebook. Durează sub 30 de secunde.' },
  { icon: <Search className="w-6 h-6 text-white" />, color: 'bg-purple-600', step: '2', title: 'Completează formularul', desc: 'Titlu, descriere, poze și preț. 4 pași simpli, maxim 2 minute.' },
  { icon: <Check className="w-6 h-6 text-white" />, color: 'bg-green-600', step: '3', title: 'Publică gratuit', desc: 'Anunțul devine instant vizibil pentru mii de cumpărători din toată țara.' },
];

const STEPS_BUY = [
  { icon: <Search className="w-6 h-6 text-white" />, color: 'bg-orange-500', step: '1', title: 'Caută și filtrează', desc: 'Folosește bara de căutare și filtrele pentru a găsi exact ce cauți.' },
  { icon: <TrendingDown className="w-6 h-6 text-white" />, color: 'bg-blue-600', step: '2', title: 'Fă o ofertă', desc: 'Dacă prețul e negociabil, propune suma ta. Vânzătorul poate accepta, refuza sau contraferta.' },
  { icon: <Check className="w-6 h-6 text-white" />, color: 'bg-green-600', step: '3', title: 'Finalizați tranzacția', desc: 'Stabiliți detaliile prin chat și finalizați în siguranță.' },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-3">Cum funcționează epostat.ro?</h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">Simplu, rapid și gratuit — pentru vânzători și cumpărători deopotrivă.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* For sellers */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-7">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-black">V</span>
            Dacă vânzezi
          </h2>
          <div className="flex flex-col gap-6">
            {STEPS_SELL.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>{s.icon}</div>
                <div>
                  <p className="font-bold text-slate-900 mb-0.5">{s.title}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/postare" className="inline-flex mt-7">
            <span className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition text-sm">
              Postează un anunț <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* For buyers */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-7">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-black">C</span>
            Dacă cumperi
          </h2>
          <div className="flex flex-col gap-6">
            {STEPS_BUY.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>{s.icon}</div>
                <div>
                  <p className="font-bold text-slate-900 mb-0.5">{s.title}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/anunturi" className="inline-flex mt-7">
            <span className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-3 rounded-xl transition text-sm">
              Caută anunțuri <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>

      {/* Features */}
      <h2 className="text-2xl font-black text-slate-900 text-center mb-8">De ce epostat.ro?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
        {[
          { icon: <Zap className="w-6 h-6 text-[#2563EB]" />, title: 'Gratuit pentru totdeauna', desc: 'Postarea anunțurilor este și va rămâne gratuită. Fără comisioane ascunse.' },
          { icon: <ShieldCheck className="w-6 h-6 text-green-500" />, title: 'Utilizatori verificați', desc: 'Sistem de verificare prin email și telefon. Știi cu cine faci afaceri.' },
          { icon: <Star className="w-6 h-6 text-blue-500" />, title: 'Sistem de recenzii', desc: 'Recenzii reale de la cumpărători și vânzători verificați.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-200/80 p-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-3">{icon}</div>
            <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0F172A] rounded-3xl p-8 text-center text-white">
        <h2 className="text-2xl font-black mb-2">Gata să începi?</h2>
        <p className="text-white/70 mb-6">Alătură-te celor 120.000+ utilizatori epostat.ro</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/inregistrare">
            <span className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition">
              <Plus className="w-4 h-4" /> Creează cont gratuit
            </span>
          </Link>
          <Link href="/anunturi">
            <span className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-6 py-3 rounded-xl transition">
              Explorează anunțuri
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
