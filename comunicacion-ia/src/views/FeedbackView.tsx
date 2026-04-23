import { useStore } from "../store/useStore";

export function FeedbackView() {
  const { feedback, reset } = useStore();
  if (!feedback) return null;

  const cumplidos = feedback.objetivos.filter((o) => o.cumplido).length;
  const total = feedback.objetivos.length;
  const porcentaje = Math.round((cumplidos / total) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
          Resultado
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
                <span className="text-5xl font-bold text-indigo-600">{feedback.puntuacion}</span>
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
            <div
              key={o.id}
              className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${
                o.cumplido ? "border-emerald-500" : "border-orange-400"
              } border-y border-r border-slate-200`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    o.cumplido
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {o.cumplido ? "✓" : "!"}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1.5">
                    {o.descripcion}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{o.comentario}</p>
                  {!o.cumplido && o.ejemplo && (
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg mt-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        💡 Sugerencia
                      </div>
                      <p className="italic text-slate-700 text-sm">"{o.ejemplo}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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