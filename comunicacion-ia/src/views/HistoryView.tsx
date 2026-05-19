// src/views/HistoryView.tsx
import { useEffect, useState } from "react";
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
  const color =
    score >= 7 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";
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
  const scoreColor =
    score >= 7 ? "text-emerald-600" : score >= 5 ? "text-amber-500" : "text-red-500";

  const objectives = session.session_objective_results ?? [];
  const feedback = session.feedback_raw ?? {};

  const messages = [...(session.session_messages ?? [])].sort(
    (a: any, b: any) =>
      new Date(a.created_at ?? a.sent_at ?? 0).getTime() -
      new Date(b.created_at ?? b.sent_at ?? 0).getTime()
  );

  // Objetivos: primero los de BD, si no los del feedback_raw
  const dbObjetivos: any[] = objectives;
  const fbObjetivos: any[] = feedback.objetivos ?? [];
  const displayObjetivos =
    dbObjetivos.length > 0
      ? dbObjetivos.map((o: any) => ({
          descripcion:
            o.scenario_objectives?.descripcion ?? o.descripcion ?? "Objetivo",
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
    <div className="mt-4 space-y-5">
      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="rounded-xl p-4 text-center border"
          style={{ background: "rgba(64,64,255,0.04)", borderColor: "rgba(64,64,255,0.12)" }}
        >
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Puntuación</div>
          <div className={`text-3xl font-bold ${scoreColor}`}>
            {score}<span className="text-base font-normal text-slate-400">/10</span>
          </div>
          <ScoreBar score={score} />
        </div>
        <div
          className="rounded-xl p-4 text-center border"
          style={{ background: "rgba(0,210,200,0.04)", borderColor: "rgba(0,210,200,0.15)" }}
        >
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Duración</div>
          <div className="text-2xl font-bold text-slate-700 mt-1">
            {formatDuration(session.duration_seconds)}
          </div>
        </div>
        <div
          className="rounded-xl p-4 text-center border"
          style={{ background: "rgba(255,45,120,0.04)", borderColor: "rgba(255,45,120,0.12)" }}
        >
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Mensajes</div>
          <div className="text-2xl font-bold text-slate-700 mt-1">
            {messages.length}
          </div>
        </div>
      </div>

      {/* Resumen */}
      {(session.resumen || feedback.resumen) && (
        <div
          className="rounded-xl p-4 border text-sm text-slate-600 leading-relaxed"
          style={{ background: "#FAFAFF", borderColor: "#E5E5F0" }}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Resumen
          </span>
          {session.resumen ?? feedback.resumen}
        </div>
      )}

      {/* Objetivos */}
      {displayObjetivos.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Objetivos
          </div>
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
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    obj.cumplido
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-orange-100 text-orange-600"
                  }`}
                >
                  {obj.cumplido ? "✓" : "!"}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 leading-snug">
                    {obj.descripcion}
                  </p>
                  {obj.comentario && (
                    <p className="text-xs text-slate-500 mt-0.5">{obj.comentario}</p>
                  )}
                  {!obj.cumplido && obj.ejemplo && (
                    <p className="text-xs italic text-slate-400 mt-1">💡 {obj.ejemplo}</p>
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
          <div
            className="space-y-2 max-h-72 overflow-y-auto pr-1 rounded-xl p-3 border"
            style={{ background: "#FAFAFF", borderColor: "#E5E5F0" }}
          >
            {messages.map((msg: any, i: number) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role !== "user" && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0 mt-1"
                    style={{ background: "rgba(64,64,255,0.12)", color: "#4040FF" }}
                  >
                    IA
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user" ? "rounded-br-sm" : "border rounded-bl-sm text-slate-700"
                  }`}
                  style={
                    msg.role === "user"
                      ? { background: "#4040FF", color: "#fff" }
                      : { background: "#fff", borderColor: "#E5E5F0" }
                  }
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

  useEffect(() => {
    async function loadSessions() {
      if (!userProfile) return;
      try {
        setError(null);

        // getAllSessions trae todas las sesiones con el perfil del usuario.
        // Filtramos por nombre o email del usuario actual.
        const data = await dbService.getAllSessions(userProfile.azure_oid);

        console.log("[HistoryView] total sesiones:", data.length);

        const mine = data.filter(
          (s: any) =>
            s.profiles?.full_name === userProfile.full_name ||
            s.profiles?.email === userProfile.email
        );

        console.log("[HistoryView] sesiones del usuario actual:", mine.length);

        setSessions(mine);
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
      (a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }
  const scenarioKeys = Object.keys(grouped);

  const globalAvg =
    sessions.length > 0
      ? Math.round(
          (sessions.reduce((acc, s) => acc + (s.puntuacion ?? 0), 0) /
            sessions.length) *
            10
        ) / 10
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#4040FF", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--stemdo-bg)" }}>
      <div className="max-w-3xl mx-auto px-6 py-10">

        <button
          onClick={() => setView("selector")}
          className="text-sm text-slate-500 hover:text-slate-900 mb-6 flex items-center gap-1.5 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al catálogo
        </button>

        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-2"
              style={{ background: "rgba(64,64,255,0.08)", color: "#4040FF" }}
            >
              Historial personal
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Mis sesiones</h1>
            {sessions.length > 0 && (
              <p className="text-sm text-slate-400 mt-1">
                {sessions.length}{" "}
                {sessions.length === 1 ? "sesión completada" : "sesiones completadas"}
              </p>
            )}
          </div>
          {globalAvg !== null && (
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-0.5">Puntuación media</div>
              <div className="text-2xl font-bold" style={{ color: "#4040FF" }}>
                {globalAvg}
                <span className="text-sm font-normal text-slate-400">/10</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}

        {!error && scenarioKeys.length === 0 && (
          <div
            className="rounded-2xl border border-dashed p-12 text-center"
            style={{ borderColor: "#C8C8E8", background: "#fff" }}
          >
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Aún no tienes sesiones guardadas. Completa tu primera práctica para verla aquí.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {scenarioKeys.map((key) => {
            const group = grouped[key];
            const isScenarioOpen = expandedScenario === key;
            const scores = group.sessions.map((s) => s.puntuacion ?? 0);
            const bestScore = Math.max(...scores);
            const avgScore =
              Math.round(
                (scores.reduce((a, b) => a + b, 0) / scores.length) * 10
              ) / 10;

            return (
              <div
                key={key}
                className="bg-white rounded-2xl border overflow-hidden shadow-sm"
                style={{ borderColor: "#E5E5F0" }}
              >
                {/* Cabecera escenario */}
                <button
                  onClick={() => {
                    setExpandedScenario(isScenarioOpen ? null : key);
                    setExpandedSession(null);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0"
                      style={{ background: "rgba(64,64,255,0.1)", color: "#4040FF" }}
                    >
                      {group.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">
                        {group.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {group.sessions.length}{" "}
                        {group.sessions.length === 1 ? "intento" : "intentos"} ·{" "}
                        Mejor:{" "}
                        <span className="font-semibold text-slate-600">
                          {bestScore}/10
                        </span>{" "}
                        · Media:{" "}
                        <span className="font-semibold text-slate-600">
                          {avgScore}/10
                        </span>
                      </p>
                    </div>
                  </div>
                  <div
                    className="text-slate-400 transition-transform duration-200 flex-shrink-0"
                    style={{ transform: isScenarioOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Lista de intentos */}
                {isScenarioOpen && (
                  <div className="border-t" style={{ borderColor: "#F0F0F8" }}>
                    {group.sessions.map((s: any, idx: number) => {
                      const isSessionOpen = expandedSession === s.id;
                      const score = s.puntuacion ?? 0;
                      const scoreColor =
                        score >= 7 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";
                      const msgCount = s.session_messages?.length ?? 0;

                      return (
                        <div
                          key={s.id}
                          className="border-b last:border-b-0"
                          style={{ borderColor: "#F0F0F8" }}
                        >
                          <button
                            onClick={() =>
                              setExpandedSession(isSessionOpen ? null : s.id)
                            }
                            className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/60 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                style={{
                                  background: "rgba(64,64,255,0.08)",
                                  color: "#4040FF",
                                }}
                              >
                                {group.sessions.length - idx}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-slate-700">
                                  {formatDate(s.started_at)}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {formatDuration(s.duration_seconds)} · {msgCount} mensajes
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className="text-sm font-bold px-2.5 py-1 rounded-lg"
                                style={{
                                  background: `${scoreColor}18`,
                                  color: scoreColor,
                                }}
                              >
                                {score}/10
                              </span>
                              <div
                                className="text-slate-400 transition-transform duration-200"
                                style={{
                                  transform: isSessionOpen
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </button>

                          {isSessionOpen && (
                            <div className="px-6 pb-5" style={{ background: "#FAFAFF" }}>
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