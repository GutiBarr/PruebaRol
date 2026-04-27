import type { Objetivo } from "../../data/scenarios";

interface Props {
  objetivos: Objetivo[];
}

export function ObjectivesSidebar({ objetivos }: Props) {
  return (
    <aside className="hidden md:block w-72 bg-white border-r border-slate-200 p-5 overflow-y-auto">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Objetivos
      </h3>
      <ul className="space-y-3">
        {objetivos.map((o, i) => (
          <li key={o.id} className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="text-xs text-slate-600 leading-relaxed">
              {o.descripcion}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}