import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { dbService } from "../services/dbService";
import { HistoryCard } from "../components/HistoryCard";

export function HistoryView() {
  const { userProfile, setView, view, mySessions, setMySessions } = useStore();
  const [loading, setLoading] = useState(mySessions.length === 0);

  useEffect(() => {
    async function loadSessions() {
      if (!userProfile) return;
      if (mySessions.length === 0) setLoading(true);
      try {
        const data = await dbService.getAllSessions(userProfile.azure_oid);
        setMySessions(data);
      } catch (error) {
        console.error("Error loading personal history:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, [userProfile, view]);

  const avgScore = mySessions.length
    ? Math.round((mySessions.reduce((acc, s) => acc + (s.puntuacion || 0), 0) / mySessions.length) * 10) / 10
    : 0;

  if (loading) return <div className="p-10 text-center text-slate-500">Cargando tu historial...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button
          onClick={() => setView("selector")}
          className="text-sm text-slate-500 hover:text-slate-900 mb-6 flex items-center gap-1 transition"
        >
          Volver al catálogo
        </button>

        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
              Historial
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Mis sesiones</h1>
          </div>
          {mySessions.length > 0 && (
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-0.5">Puntuación media</div>
              <div className="text-2xl font-bold text-indigo-600">{avgScore}<span className="text-sm font-normal text-slate-400">/10</span></div>
            </div>
          )}
        </div>

        {mySessions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-500 text-sm">
              Aún no tienes sesiones guardadas en la nube. Completa tu primera práctica para verla aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {mySessions.map((s) => (
              <HistoryCard key={s.id} record={{
                ...s,
                scenarioTitle: s.scenarios?.titulo || "Escenario",
                date: s.started_at,
                feedback: s.feedback_raw || { puntuacion: s.puntuacion }
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
