import type { Scenario } from "../../data/scenarios";

interface Props {
  scenario: Scenario;
  index: number;
  onSelect: (scenario: Scenario) => void;
}

export function ScenarioCard({ scenario, index, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(scenario)}
      className="group text-left bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-indigo-300 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-400">
            #{String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
            →
          </span>
        </div>

        <h3 className="font-bold text-xl text-slate-900 mb-2">{scenario.titulo}</h3>
        <p className="text-slate-600 text-sm mb-5 leading-relaxed">{scenario.descripcion}</p>

        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-5">
          <div className="text-xs text-slate-400 mb-1">La IA te dirá:</div>
          <p className="text-sm text-slate-700 italic line-clamp-2">
            "{scenario.frasenicial}"
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs pt-4 border-t border-slate-100">
          <div>
            <div className="text-slate-400">Tu rol</div>
            <div className="font-semibold text-slate-700 mt-0.5">{scenario.rolUsuario}</div>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div>
            <div className="text-slate-400">Rol de la IA</div>
            <div className="font-semibold text-slate-700 mt-0.5">{scenario.rolIA}</div>
          </div>
        </div>
      </div>
    </button>
  );
}