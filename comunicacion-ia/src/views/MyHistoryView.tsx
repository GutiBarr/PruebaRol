import { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { useStore } from '../store/useStore';

function formatDuration(secs: number) {
  if (!secs) return "N/A";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function MyHistoryView() {
  const { userProfile, setView } = useStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      if (!userProfile) return;
      try {
        const data = await dbService.getMySessionsWithDetails(userProfile.azure_oid);
        setSessions(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userProfile]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (selectedSession) {
    const cumplidos = selectedSession.session_objective_results?.filter((o: any) => o.cumplido).length ?? 0;
    const total = selectedSession.session_objective_results?.length ?? 0;
    const score = selectedSession.puntuacion ?? 0;
    const scoreColor = score >= 7 ? "text-emerald-600" : score >= 5 ? "text-amber-500" : "text-red-500";

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <button
            onClick={() => setSelectedSession(null)}
            className="text-sm text-slate-500 hover:text-slate-900 mb-6 flex items-center gap-1 transition"
          >
            ← Volver al historial
          </button>

          <div className="mb-2 text-xs font-semibold text-indigo-600 uppercase tracking-wide">Detalle de sesión</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">
            {selectedSession.scenarios?.titulo ?? "Escenario eliminado"}
          </h1>
          <p className="text-sm text-slate-500 mb-8">{formatDate(selectedSession.started_at)}</p>

          {/* Resumen */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Puntuación</div>
                <div className={`text-4xl font-bold ${scoreColor}`}>
                  {score}<span className="text-base font-normal text-slate-400">/10</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Objetivos</div>
                <div className="text-4xl font-bold text-emerald-600">
                  {cumplidos}<span className="text-base font-normal text-slate-400">/{total}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Duración</div>
                <div className="text-2xl font-bold text-slate-700">
                  {formatDuration(selectedSession.duration_seconds)}
                </div>
              </div>
            </div>
            {selectedSession.resumen && (
              <p className="text-slate-600 border-t border-slate-100 pt-4 text-sm leading-relaxed">
                {selectedSession.resumen}
              </p>
            )}
          </div>

          {/* Objetivos */}
          {selectedSession.session_objective_results?.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-lg text-slate-900 mb-3">Objetivos</h2>
              <div className="space-y-3">
                {selectedSession.session_objective_results.map((obj: any, i: number) => (
                  <div
                    key={i}
                    className={`bg-white p-4 rounded-xl border-l-4 shadow-sm ${obj.cumplido ? "border-emerald-500" : "border-orange-400"} border-y border-r border-slate-200`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${obj.cumplido ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                        {obj.cumplido ? "✓" : "!"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm mb-1">
                          {obj.scenario_objectives?.descripcion ?? "Objetivo"}
                        </p>
                        <p className="text-slate-500 text-sm">{obj.comentario}</p>
                        {!obj.cumplido && obj.ejemplo && (
                          <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg mt-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase">💡 Sugerencia: </span>
                            <span className="italic text-slate-600 text-xs">"{obj.ejemplo}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensajes */}
          {selectedSession.session_messages?.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg text-slate-900 mb-3">Conversación</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {[...selectedSession.session_messages]
                  .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((msg: any, i: number) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role !== "user" && (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                          IA
                        </div>
                      )}
                      <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button
          onClick={() => setView("selector")}
          className="text-sm text-slate-500 hover:text-slate-900 mb-6 flex items-center gap-1 transition"
        >
          ← Volver al catálogo
        </button>

        <div className="mb-2 text-xs font-semibold text-indigo-600 uppercase tracking-wide">Historial</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Mis sesiones</h1>

        {sessions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-500 text-sm">Aún no tienes sesiones guardadas. Completa tu primera práctica para verla aquí.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => {
              const score = s.puntuacion ?? 0;
              const color = score >= 7 ? "text-emerald-600" : score >= 5 ? "text-amber-500" : "text-red-500";
              const cumplidos = s.session_objective_results?.filter((o: any) => o.cumplido).length ?? 0;
              const total = s.session_objective_results?.length ?? 0;

              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSession(s)}
                  className="w-full text-left bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 text-sm leading-tight pr-4">
                      {s.scenarios?.titulo ?? "Escenario eliminado"}
                    </h3>
                    <span className={`text-2xl font-bold ${color} flex-shrink-0`}>
                      {score}<span className="text-sm font-normal text-slate-400">/10</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3 flex-wrap">
                    <span>📅 {formatDate(s.started_at)}</span>
                    <span>⏱ {formatDuration(s.duration_seconds)}</span>
                    <span>🎯 {cumplidos}/{total} objetivos</span>
                    <span>💬 {s.session_messages?.length ?? 0} mensajes</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${score >= 7 ? "bg-emerald-500" : score >= 5 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: `${score * 10}%` }}
                    />
                  </div>
                  {s.resumen && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{s.resumen}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}