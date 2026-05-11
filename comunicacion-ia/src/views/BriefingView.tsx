import { useStore } from "../store/useStore";

export function BriefingView() {
  const { scenario, startChat, reset } = useStore();
  if (!scenario) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button
          onClick={reset}
          className="text-sm text-slate-500 hover:text-slate-900 mb-6 flex items-center gap-1 transition"
        >
          Volver a escenarios
        </button>

        <div className="mb-6">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
            Briefing
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            {scenario.titulo}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-start gap-4 hover:border-indigo-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 shadow-inner">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tu Rol</div>
              <div className="text-slate-800 font-medium leading-snug">{scenario.rol_usuario}</div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-start gap-4 hover:border-violet-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 text-violet-600 shadow-inner">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rol de la IA</div>
              <div className="text-slate-800 font-medium leading-snug">{scenario.rol_ia}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-4">
          <h2 className="font-semibold mb-3 text-slate-900 flex items-center gap-2">
            <span className="text-lg"></span> Contexto
          </h2>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
            {scenario.contexto}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h2 className="font-semibold mb-4 text-slate-900 flex items-center gap-2">
            <span className="text-lg"></span> Objetivos de la sesión
          </h2>
          <ul className="space-y-3">
            {scenario.objetivos?.map((o: any, i: number) => (
              <li key={o.id || i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-slate-700 leading-relaxed">{o.descripcion}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={startChat}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
        >
          Empezar conversación →
        </button>
      </div>
    </div>
  );
}
