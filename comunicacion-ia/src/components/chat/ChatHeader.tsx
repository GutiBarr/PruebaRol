import type { Scenario } from "../../types/database";
//
interface Props {
  scenario: Scenario;
  voiceMode: boolean;
  voiceOutputAvailable: boolean;
  loading: boolean;
  canFinish: boolean;
  onBack: () => void;
  onToggleVoice: () => void;
  onFinish: () => void;
}

export function ChatHeader({
  scenario,
  voiceMode,
  voiceOutputAvailable,
  loading,
  canFinish,
  onBack,
  onToggleVoice,
  onFinish,
}: Props) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-700 transition"
          title="Salir"
        >
          ←
        </button>
        <div>
          <h2 className="font-semibold text-slate-900">{scenario.titulo}</h2>
          <p className="text-xs text-slate-500">
            {scenario.rol_usuario}
            <span className="text-slate-300 mx-1">·</span> vs
            <span className="text-slate-300 mx-1">·</span>
            {scenario.rol_ia}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {voiceOutputAvailable && (
          <button
            onClick={onToggleVoice}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition ${voiceMode
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            title="Activar/desactivar voz de la IA"
          >
            <span>{voiceMode ? "🔊" : "🔇"}</span>
            <span className="hidden md:inline">
              {voiceMode ? "Voz activa" : "Voz apagada"}
            </span>
          </button>
        )}
        <button
          onClick={onFinish}
          disabled={!canFinish || loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Terminar y ver feedback
        </button>
      </div>
    </header>
  );
}
