import type { Objetivo } from "../../data/scenarios";

interface ObjetivoConProgreso extends Objetivo {
  progress: number;
  inProgress: boolean;
  likelyCumplido: boolean;
}

interface Props {
  objetivos: ObjetivoConProgreso[];
}

export function ObjectivesSidebar({ objetivos }: Props) {
  return (
    <aside className="hidden md:block w-72 bg-white border-r border-slate-200 p-5 overflow-y-auto">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Objetivos
      </h3>
      <ul className="space-y-4">
        {objetivos.map((o, i) => (
          <li key={o.id} className="flex gap-3">
            <span
              className={`flex-shrink-0 w-5 h-5 text-xs font-semibold rounded-full flex items-center justify-center mt-0.5 transition-colors duration-300 ${o.likelyCumplido
                  ? "bg-emerald-100 text-emerald-700"
                  : o.inProgress
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                }`}
            >
              {o.likelyCumplido ? "✓" : i + 1}
            </span>
            <div className="flex-1">
              <span className="text-xs text-slate-600 leading-relaxed block mb-1.5">
                {o.descripcion}
              </span>
              {/* Barra de progreso */}
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${o.likelyCumplido
                      ? "bg-emerald-500"
                      : o.inProgress
                        ? "bg-amber-400"
                        : "bg-slate-200"
                    }`}
                  style={{ width: `${Math.round(o.progress * 100)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-slate-300 mt-6 leading-relaxed">
        Indicador orientativo basado en tus mensajes
      </p>
    </aside>
  );
}
