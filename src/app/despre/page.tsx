import Link from 'next/link';
import { Heart, Target, Users, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="text-3xl font-black text-slate-900">e<span className="text-[#2563EB]">postat</span><span className="text-slate-400 font-normal">.ro</span></span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4">Povestea noastră</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
          epostat.ro s-a născut dintr-o idee simplă: să facem cumpăratul și vânzatul online cât mai uman, simplu și de încredere în România.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
        {[
          { icon: <Target className="w-6 h-6 text-blue-600" />, title: 'Misiunea noastră', desc: 'Să construim cel mai prietenos marketplace din România — unde oricine poate vinde și cumpăra fără bătăi de cap, indiferent de vârstă sau experiența tehnică.' },
          { icon: <Heart className="w-6 h-6 text-red-500" />, title: 'Valorile noastre', desc: 'Transparență, simplitate și comunitate. Credem că tranzacțiile bune se construiesc pe comunicare deschisă și încredere reciprocă.' },
          { icon: <Users className="w-6 h-6 text-green-600" />, title: 'Comunitatea', desc: 'Peste 120.000 de utilizatori activi din toată România. De la studenți care vând haine, la antreprenori care listează utilaje — epostat.ro e pentru toată lumea.' },
          { icon: <Zap className="w-6 h-6 text-[#2563EB]" />, title: 'Inovație continuă', desc: 'Sistemul nostru de negociere inspirat din piețele moderne permite cumpărătorilor și vânzătorilor să ajungă rapid la un preț corect pentru ambele părți.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-200/80 p-6 flex gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">{icon}</div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 mb-10">
        <h2 className="text-2xl font-black text-slate-900 mb-4">Numele: „e postat"</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Numele epostat.ro e un joc de cuvinte tipic românesc: „e postat" — adică anunțul tău e deja online, ai terminat treaba. Dar și „e-postat", din lumea digitală, a platformelor moderne.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Vrem ca experiența să fie atât de simplă încât, în momentul în care publici un anunț, să poți spune literal: „gata, e postat!"
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Fondată', value: '2024' },
          { label: 'Utilizatori', value: '120k+' },
          { label: 'Anunțuri active', value: '48k+' },
          { label: 'Orașe', value: '250+' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 text-center">
            <p className="text-3xl font-black text-[#2563EB]">{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-slate-500 mb-4">Ai întrebări sau sugestii?</p>
        <Link href="/ajutor">
          <span className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-6 py-3 rounded-xl transition">
            Contactează-ne
          </span>
        </Link>
      </div>
    </div>
  );
}
