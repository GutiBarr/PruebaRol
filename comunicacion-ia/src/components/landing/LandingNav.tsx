export function LandingNav() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            R
          </div>
          <span className="font-semibold text-slate-900">RolePlay Stemdo</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <span className="hidden md:block">Plataforma de entrenamiento</span>
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            Activo
          </span>
        </div>
      </div>
    </nav>
  );
}