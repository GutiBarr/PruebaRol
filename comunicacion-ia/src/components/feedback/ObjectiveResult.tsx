import type { EvaluacionObjetivo } from "../../services/groqService";

interface Props {
  objetivo: EvaluacionObjetivo;
}

export function ObjectiveResult({ objetivo }: Props) {
  return (
    <div
      className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${
        objetivo.cumplido ? "border-emerald-500" : "border-orange-400"
      } border-y border-r border-slate-200`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
            objetivo.cumplido
              ? "bg-emerald-100 text-emerald-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {objetivo.cumplido ? "✓" : "!"}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1.5">
            {objetivo.descripcion}
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            {objetivo.comentario}
          </p>
          {!objetivo.cumplido && objetivo.ejemplo && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg mt-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                💡 Sugerencia
              </div>
              <p className="italic text-slate-700 text-sm">"{objetivo.ejemplo}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}