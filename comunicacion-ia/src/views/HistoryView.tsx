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
  const bestScore = mySessions.length
    ? Math.max(...mySessions.map(s => s.puntuacion || 0))
    : 0;

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
        <div className="max-w-2xl mx-auto px-6 py-8">
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
            </div>
            <div className="opacity-20">
              <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-4 pb-12">
        {/* Stats bar */}
        {mySessions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">{mySessions.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">Sesiones</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{avgScore}<span className="text-sm font-normal text-slate-400">/10</span></div>
              <div className="text-xs text-slate-400 mt-0.5">Media</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{bestScore}<span className="text-sm font-normal text-slate-400">/10</span></div>
              <div className="text-xs text-slate-400 mt-0.5">Mejor nota</div>
            </div>
          </div>
        )}

        {mySessions.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center mt-8">
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
        ) : (
          <div className="space-y-4">
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
