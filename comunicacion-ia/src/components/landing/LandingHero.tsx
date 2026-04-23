interface Props {
  totalScenarios: number;
}

export function LandingHero({ totalScenarios }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-slate-50"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm text-slate-700 px-3 py-1.5 rounded-full text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            Impulsado por IA generativa
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.05]">
            Entrena conversaciones <br />
            <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
              que marcan la diferencia
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Practica situaciones reales de trabajo con una IA que se adapta a ti.
            Recibe feedback inmediato sobre tus puntos fuertes y áreas a mejorar.
          </p>
          <a
            href="#escenarios"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition shadow-lg shadow-slate-900/10"
          >
            Empezar a practicar
            <span>↓</span>
          </a>
        </div>

        <div className="mt-20 grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-slate-900">{totalScenarios}</div>
            <div className="text-xs md:text-sm text-slate-500 mt-1">Escenarios listos</div>
          </div>
          <div className="text-center border-x border-slate-200">
            <div className="text-3xl md:text-4xl font-bold text-slate-900">∞</div>
            <div className="text-xs md:text-sm text-slate-500 mt-1">Práctica ilimitada</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-slate-900">100%</div>
            <div className="text-xs md:text-sm text-slate-500 mt-1">Feedback personalizado</div>
          </div>
        </div>
      </div>
    </section>
  );
}