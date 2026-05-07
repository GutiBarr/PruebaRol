import { useStore } from "../store/useStore";

export function BriefingView() {
  const { scenario, startChat, reset } = useStore();
  if (!scenario) return null;

  // Adaptar objetivos si vienen de la DB
  const displayObjectives = (scenario as any).scenario_objectives || (scenario as any).objetivos || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button
          onClick={reset}
          className="text-sm text-slate-500 hover:text-slate-900 mb-6 flex items-center gap-1 transition"
        >
          ← Volver a escenarios
        </button>

        <div className="mb-8">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
            Briefing
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            {scenario.titulo}
          </h1>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-full text-sm">
              <span className="text-slate-400 text-xs">Tú</span>
              <strong className="text-slate-700">{scenario.rol_usuario}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-full text-sm">
              <span className="text-slate-400 text-xs">IA</span>
              <strong className="text-slate-700">{scenario.rol_ia}</strong>
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-4">
          <h2 className="font-semibold mb-3 text-slate-900 flex items-center gap-2">
            <span className="text-lg">📋</span> Contexto
          </h2>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
            {scenario.contexto}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h2 className="font-semibold mb-4 text-slate-900 flex items-center gap-2">
            <span className="text-lg">🎯</span> Objetivos de la sesión
          </h2>
          <ul className="space-y-3">
            {displayObjectives.map((o: any, i: number) => (
              <li key={o.id} className="flex gap-3">
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