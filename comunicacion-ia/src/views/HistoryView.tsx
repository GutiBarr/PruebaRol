import { useEffect, useState, useRef } from "react";
import { useStore } from "../store/useStore";
import { dbService } from "../services/dbService";

function formatDuration(secs: number) {
  if (!secs || secs === 0) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 7 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${score * 10}%`, background: color }}
      />
    </div>
  );
}

function SessionDetail({ session }: { session: any }) {
  const score = session.puntuacion ?? 0;
  const scoreColor = score >= 7 ? "text-emerald-600" : score >= 5 ? "text-amber-500" : "text-red-500";
  const objectives = session.session_objective_results ?? [];
  const feedback = session.feedback_raw ?? {};

  const messages = [...(session.session_messages ?? [])].sort(
    (a: any, b: any) =>
      new Date(a.created_at ?? a.sent_at ?? 0).getTime() -
      new Date(b.created_at ?? b.sent_at ?? 0).getTime()
  );

  const dbObjetivos: any[] = objectives;
  const fbObjetivos: any[] = feedback.objetivos ?? [];
  const displayObjetivos =
    dbObjetivos.length > 0
      ? dbObjetivos.map((o: any) => ({
          descripcion: o.scenario_objectives?.descripcion ?? o.descripcion ?? "Objetivo",
          cumplido: o.cumplido,
          comentario: o.comentario,
          ejemplo: o.ejemplo,
        }))
      : fbObjetivos.map((o: any) => ({
          descripcion: o.descripcion ?? "Objetivo",
          cumplido: o.cumplido,
          comentario: o.comentario,
          ejemplo: o.ejemplo,
        }));

  return (
    <div className="mt-4 space-y-4">
      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 text-center border border-indigo-100 bg-indigo-50/40">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Puntuación</div>
          <div className={`text-3xl font-bold ${scoreColor}`}>
            {score}<span className="text-base font-normal text-slate-400">/10</span>
          </div>
          <ScoreBar score={score} />
        </div>
        <div className="rounded-xl p-4 text-center border border-teal-100 bg-teal-50/40">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Duración</div>
          <div className="text-2xl font-bold text-slate-700 mt-1">
            {formatDuration(session.duration_seconds)}
          </div>
        </div>
        <div className="rounded-xl p-4 text-center border border-pink-100 bg-pink-50/40">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Mensajes</div>
          <div className="text-2xl font-bold text-slate-700 mt-1">{messages.length}</div>
        </div>
      </div>

      {/* Resumen */}
      {(session.resumen || feedback.resumen) && (
        <div className="rounded-xl p-4 border border-slate-100 bg-slate-50/60 text-sm text-slate-600 leading-relaxed">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Resumen</span>
          {session.resumen ?? feedback.resumen}
        </div>
      )}

      {/* Objetivos */}
      {displayObjetivos.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Objetivos</div>
          <div className="space-y-2">
            {displayObjetivos.map((obj: any, i: number) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl border-l-4 ${
                  obj.cumplido
                    ? "border-emerald-400 bg-emerald-50/60"
                    : "border-orange-300 bg-orange-50/60"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  obj.cumplido ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-600"
                }`}>
                  {obj.cumplido ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v4m0 4h.01" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 leading-snug">{obj.descripcion}</p>
                  {obj.comentario && (
                    <p className="text-xs text-slate-500 mt-0.5">{obj.comentario}</p>
                  )}
                  {!obj.cumplido && obj.ejemplo && (
                    <p className="text-xs italic text-slate-400 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      {obj.ejemplo}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversación */}
      {messages.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Conversación ({messages.length} mensajes)
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 rounded-xl p-3 border border-slate-100 bg-slate-50/60">
            {messages.map((msg: any, i: number) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role !== "user" && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0 mt-1 bg-indigo-100 text-indigo-700">
                    IA
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "border border-slate-200 rounded-bl-sm text-slate-700 bg-white"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryView() {
  const { userProfile, setView } = useStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    async function loadSessions() {
      if (!userProfile) return;
      // Evita parpadeo: solo muestra spinner la primera vez
      if (!hasFetched.current) setLoading(true);
      try {
        setError(null);
        const data = await dbService.getAllSessions(userProfile.azure_oid);
        const mine = data.filter(
          (s: any) =>
            s.profiles?.full_name === userProfile.full_name ||
            s.profiles?.email === userProfile.email
        );
        setSessions(mine);
        hasFetched.current = true;
      } catch (err: any) {
        console.error("Error loading history:", err);
        setError(err.message ?? "Error al cargar el historial");
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, [userProfile]);

  // Agrupar por escenario
  const grouped: Record<string, { title: string; sessions: any[] }> = {};
  for (const s of sessions) {
    const sid = s.scenario_id ?? "unknown";
    const title = s.scenarios?.titulo ?? "Escenario eliminado";
    if (!grouped[sid]) grouped[sid] = { title, sessions: [] };
    grouped[sid].sessions.push(s);
  }
  for (const key of Object.keys(grouped)) {
    grouped[key].sessions.sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }
  const scenarioKeys = Object.keys(grouped);

  const avgScore =
    sessions.length > 0
      ? Math.round((sessions.reduce((acc, s) => acc + (s.puntuacion ?? 0), 0) / sessions.length) * 10) / 10
      : null;
  const bestScore =
    sessions.length > 0 ? Math.max(...sessions.map(s => s.puntuacion ?? 0)) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm">Cargando tu historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <button
            onClick={() => setView("selector")}
            className="flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm mb-6 transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al catálogo
          </button>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">Tu progreso</p>
              <h1 className="text-3xl font-bold">Mis Sesiones</h1>
              {sessions.length > 0 && (
                <p className="text-indigo-200 text-sm mt-1">
                  {sessions.length} {sessions.length === 1 ? "sesión completada" : "sesiones completadas"}
                </p>
              )}
            </div>
            <div className="opacity-20">
              <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-12">
        {/* Stats bar */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 -mt-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">{sessions.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">Sesiones</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {avgScore}<span className="text-sm font-normal text-slate-400">/10</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Media</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {bestScore}<span className="text-sm font-normal text-slate-400">/10</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Mejor nota</div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600 flex items-center gap-2 mt-6">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!error && scenarioKeys.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center mt-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-700 mb-2">Aún no hay sesiones</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Completa tu primera práctica para verla reflejada aquí.
            </p>
            <button
              onClick={() => setView("selector")}
              className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Ir al catálogo
            </button>
          </div>
        )}

        {/* Scenario accordion */}
        <div className="space-y-3">
          {scenarioKeys.map((key) => {
            const group = grouped[key];
            const isScenarioOpen = expandedScenario === key;
            const scores = group.sessions.map((s) => s.puntuacion ?? 0);
            const groupBest = Math.max(...scores);
            const groupAvg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;

            return (
              <div
                key={key}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => {
                    setExpandedScenario(isScenarioOpen ? null : key);
                    setExpandedSession(null);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0 bg-indigo-100 text-indigo-700">
                      {group.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{group.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {group.sessions.length} {group.sessions.length === 1 ? "intento" : "intentos"} ·{" "}
                        Mejor: <span className="font-semibold text-slate-600">{groupBest}/10</span> ·{" "}
                        Media: <span className="font-semibold text-slate-600">{groupAvg}/10</span>
                      </p>
                    </div>
                  </div>
                  <div className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${isScenarioOpen ? "rotate-180 text-indigo-500" : ""}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isScenarioOpen && (
                  <div className="border-t border-slate-100">
                    {group.sessions.map((s: any, idx: number) => {
                      const isSessionOpen = expandedSession === s.id;
                      const score = s.puntuacion ?? 0;
                      const scoreColor = score >= 7 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";
                      const msgCount = s.session_messages?.length ?? 0;

                      return (
                        <div key={s.id} className="border-b border-slate-50 last:border-b-0">
                          <button
                            onClick={() => setExpandedSession(isSessionOpen ? null : s.id)}
                            className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/60 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-indigo-50 text-indigo-600">
                                {group.sessions.length - idx}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-slate-700">{formatDate(s.started_at)}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {formatDuration(s.duration_seconds)} · {msgCount} mensajes
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className="text-sm font-bold px-2.5 py-1 rounded-lg"
                                style={{ background: `${scoreColor}18`, color: scoreColor }}
                              >
                                {score}/10
                              </span>
                              <div className={`text-slate-400 transition-transform duration-200 ${isSessionOpen ? "rotate-180 text-indigo-500" : ""}`}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </button>

                          {isSessionOpen && (
                            <div className="px-6 pb-5 bg-slate-50/40">
                              <SessionDetail session={s} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
