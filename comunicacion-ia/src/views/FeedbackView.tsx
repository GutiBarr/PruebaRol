import { useEffect, useState, useRef } from "react";
import { useStore } from "../store/useStore";
import { ObjectiveResult } from "../components/feedback/ObjectiveResult";
import { dbService } from "../services/dbService";

export function FeedbackView() {
  const { feedback, scenario, messages, reset, userProfile, sessionSeconds } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const savingStarted = useRef(false);

  useEffect(() => {
    async function saveSession() {
      if (!feedback || !scenario || !userProfile || saved || isSaving || savingStarted.current) {
        return;
      }

      savingStarted.current = true;
      setIsSaving(true);
      setSaveError(false);

      try {
        const validMessages = messages
          .filter(m => m.content && m.content.trim() !== '')
          .map(m => ({ role: m.role, content: m.content.trim() }))
          .filter((m, i, arr) => i === 0 || m.content !== arr[i - 1].content || m.role !== arr[i - 1].role);

        if (validMessages.length === 0) {
          console.warn("No hay mensajes válidos para guardar.");
          setIsSaving(false);
          savingStarted.current = false;
          return;
        }

        await dbService.saveCompleteSession({
          scenario_id: scenario.id,
          duration_seconds: sessionSeconds,
          puntuacion: feedback.puntuacion,
          resumen: feedback.resumen,
          feedback_raw: feedback,
          messages: validMessages,
          objective_results: feedback.objetivos.map(o => ({
            objective_id: o.id,
            cumplido: o.cumplido,
            comentario: o.comentario,
            ejemplo: o.ejemplo
          })),
          azure_oid: userProfile.azure_oid
        });

        setSaved(true);
      } catch (error) {
        console.error("Error al guardar la sesión:", error);
        setSaveError(true);
        savingStarted.current = false;
      } finally {
        setIsSaving(false);
      }
    }

    saveSession();
  }, [feedback, scenario, messages, saved, isSaving, userProfile, sessionSeconds]);

  if (!feedback) return null;

  const cumplidos = feedback.objetivos.filter((o) => o.cumplido).length;
  const total = feedback.objetivos.length;
  const porcentaje = Math.round((cumplidos / total) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex justify-between items-start mb-2">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
            Resultado
          </div>
          <div>
            {isSaving && <span className="text-[10px] text-slate-400 animate-pulse">Guardando en historial...</span>}
            {saved && <span className="text-[10px] text-emerald-500 font-medium italic">✓ Guardado</span>}
            {saveError && <span className="text-[10px] text-red-400 italic">⚠ Error al guardar</span>}
          </div>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-8 tracking-tight">
          Así fue tu sesión
        </h1>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="grid grid-cols-2 gap-6 mb-5">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Puntuación
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-indigo-600">
                  {feedback.puntuacion}
                </span>
                <span className="text-xl font-medium text-slate-400">/10</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Objetivos cumplidos
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-emerald-600">{cumplidos}</span>
                <span className="text-xl font-medium text-slate-400">/{total}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${porcentaje}%` }}
                ></div>
              </div>
            </div>
          </div>
          <p className="text-slate-700 border-t border-slate-100 pt-4 leading-relaxed">
            {feedback.resumen}
          </p>
        </div>

        <h2 className="font-semibold text-lg text-slate-900 mb-4">
          Detalle por objetivo
        </h2>

        <div className="space-y-3 mb-8">
          {feedback.objetivos.map((o) => (
            <ObjectiveResult key={o.id} objetivo={o} />
          ))}
        </div>

        <button
          onClick={reset}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
        >
          Practicar otro escenario
        </button>
      </div>
    </div>
  );
}