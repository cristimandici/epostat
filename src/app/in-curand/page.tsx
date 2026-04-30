export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Logo */}
        <div className="inline-flex items-center gap-3 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-lg">
            <svg width="30" height="30" viewBox="0 0 20 20" fill="none">
              <path d="M4 14L8 6L12 11L15 8L17 14H4Z" fill="white" opacity="0.9" />
              <circle cx="15" cy="5" r="2.5" fill="#F59E0B" />
            </svg>
          </div>
          <span className="text-3xl font-black text-white">
            e<span className="text-[#60A5FA]">postat</span>
            <span className="text-slate-400 font-normal">.ro</span>
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
          Lansăm în curând
        </h1>
        <p className="text-slate-300 text-lg mb-10 leading-relaxed">
          Construim cea mai bună piață online din România.<br />
          Simplu, rapid, de încredere.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { emoji: '🚀', label: 'Gratuit' },
            { emoji: '🤝', label: 'Negociere directă' },
            { emoji: '🔒', label: 'Sigur' },
          ].map(({ emoji, label }) => (
            <div key={label} className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3 text-center">
              <div className="text-2xl mb-1">{emoji}</div>
              <p className="text-white text-sm font-semibold">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-slate-500 text-sm">
          © 2025 epostat.ro — Toate drepturile rezervate
        </p>
      </div>
    </div>
  );
}
