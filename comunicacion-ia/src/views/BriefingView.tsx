import { useStore } from "../store/useStore";
import { dbService } from "../services/dbService";

function getNivelColor(nivel: string | undefined): string {
  if (!nivel) return "bg-slate-50 text-slate-700 border-slate-200";
  switch (nivel.toLowerCase()) {
    case "trainee": return "bg-green-50 text-green-700 border-green-200";
    case "graduate": return "bg-blue-50 text-blue-700 border-blue-200";
    case "specialist": return "bg-violet-50 text-violet-700 border-violet-200";
    case "allstar": return "bg-amber-50 text-amber-700 border-amber-200";
    default: return "bg-indigo-50 text-indigo-700 border-indigo-200";
  }
}

function getCompetenciaColor(competencia: string | undefined): string {
  if (!competencia) return "bg-slate-50 text-slate-700 border-slate-200";
  switch (competencia.toLowerCase()) {
    case "problem solving": return "bg-red-50 text-red-700 border-red-200";
    case "learning curve": return "bg-orange-50 text-orange-700 border-orange-200";
    case "collaboration": return "bg-lime-50 text-lime-700 border-lime-200";
    case "fellowship": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "leadership": return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "people-hands (empathy)": return "bg-pink-50 text-pink-700 border-pink-200";
    case "communication": return "bg-sky-50 text-sky-700 border-sky-200";
    case "commitment": return "bg-rose-50 text-rose-700 border-rose-200";
    case "extra-mile": return "bg-purple-50 text-purple-700 border-purple-200";
    case "ownership": return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
    default: return "bg-violet-50 text-violet-700 border-violet-200";
  }
}

export function BriefingView() {
  const { scenario, startChat, reset, userProfile } = useStore();

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
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {scenario.nivel && (
              <span className={`border ${getNivelColor(scenario.nivel)} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {scenario.nivel}
              </span>
            )}
            {scenario.competencia && (
              <span className={`border ${getCompetenciaColor(scenario.competencia)} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                {scenario.competencia}
              </span>
            )}
          </div>
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
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Contexto
          </h2>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
            {scenario.contexto}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h2 className="font-semibold mb-4 text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Objetivos de la sesión
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
          onClick={async () => {
            if (scenario?.id && userProfile?.azure_oid) {
              await dbService.cleanupPendingSessions(scenario.id, userProfile.azure_oid).catch(console.error);
            }
            startChat();
          }}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
        >
          Empezar conversación
        </button>
      </div>
    </div>
  );
}
