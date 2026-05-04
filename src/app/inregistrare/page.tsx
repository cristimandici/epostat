'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, Check, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', agree: false });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.agree) return;
    if (form.password.length < 8) { setError('Parola trebuie să aibă cel puțin 8 caractere.'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message === 'User already registered'
        ? 'Există deja un cont cu acest email. Încearcă să te conectezi.'
        : error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthColors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-500'];
  const strengthLabels = ['', 'Slabă', 'Medie', 'Puternică'];

  if (done) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Cont creat cu succes!</h1>
          <p className="text-slate-500 mb-6">
            Am trimis un email de confirmare la <strong className="text-slate-800">{form.email}</strong>. Verifică inbox-ul (și spam-ul) și apasă pe link pentru a activa contul.
          </p>
          <Link href="/login">
            <Button size="lg" fullWidth>Conectează-te acum</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <span className="text-2xl font-black text-slate-900">e<span className="text-[#2563EB]">postat</span><span className="text-slate-400 font-normal">.ro</span></span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 mt-5 mb-1">Creează cont gratuit</h1>
          <p className="text-slate-500 text-sm">Publică anunțuri și negociază direct</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-sm">
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={handleGoogle}
              disabled={oauthLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-sm font-medium text-slate-700 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {oauthLoading ? 'Se redirecționează...' : 'Înregistrare cu Google'}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">sau cu email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nume complet</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ion Popescu" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresă email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@exemplu.ro" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Parolă</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Minim 8 caractere" className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex gap-1 items-center">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength ? strengthColors[strength] : 'bg-slate-200'}`} />
                  ))}
                  <span className="text-xs text-slate-500 ml-2">{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.agree} onChange={(e) => set('agree', e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-xs text-slate-600 leading-relaxed">
                Sunt de acord cu <Link href="/termeni" className="text-blue-600 hover:underline">Termenii și condițiile</Link> și{' '}
                <Link href="/confidentialitate" className="text-blue-600 hover:underline">Politica de confidențialitate</Link> epostat.ro.
              </span>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">{error}</div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading} disabled={!form.agree} className="gap-2 mt-1">
              Creează contul <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Ai deja cont?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">Conectează-te</Link>
        </p>
      </div>
    </div>
  );
}
