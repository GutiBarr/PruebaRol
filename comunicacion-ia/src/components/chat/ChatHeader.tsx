import type { Scenario } from "../../types/database";
import { VoiceSelector } from "./VoiceSelector";
import logoColor from "../assets/Stemdo_Principal_Color.png";

interface Props {
  scenario: Scenario;
  voiceMode: boolean;
  voiceOutputAvailable: boolean;
  loading: boolean;
  canFinish: boolean;
  onBack: () => void;
  onToggleVoice: () => void;
  onFinish: () => void;
  sessionTime: string;
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
  sessionTime,
}: Props) {
  return (
    <header className="bg-white border-b sticky top-0 z-20" style={{ borderColor: "#E5E5F0" }}>

      <div className="px-6 py-3 flex justify-between items-center">
        {/* Left: back + scenario info */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-110"
            style={{ background: "rgba(64,64,255,0.08)", color: "#4040FF" }}
            title="Salir"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Logo */}
          <img src={logoColor} alt="Stemdo" className="h-5 object-contain hidden sm:block" />

          <div className="border-l pl-4" style={{ borderColor: "#E5E5F0" }}>
            <h2 className="font-bold text-slate-900 text-sm leading-none mb-0.5">
              {scenario.titulo}
            </h2>
            <p className="text-xs" style={{ color: "#9090B0" }}>
              {scenario.rol_usuario}
              <span className="mx-1.5" style={{ color: "#D0D0E0" }}>·</span>
              {scenario.rol_ia}
            </p>
          </div>
        </div>

        {/* Right: timer + voice + finish */}
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold"
            style={{ background: "rgba(64,64,255,0.06)", color: "#4040FF" }}
          >
            <span style={{ color: "#00D2C8" }}>⏱</span>
            {sessionTime}
          </div>

          {voiceOutputAvailable && voiceMode && <VoiceSelector />}

          {voiceOutputAvailable && (
            <button
              onClick={onToggleVoice}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-all"
              style={
                voiceMode
                  ? { background: "#4040FF", color: "#fff" }
                  : { background: "rgba(64,64,255,0.06)", color: "#6B7280" }
              }
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
            className="px-4 py-2 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            style={{
              background: canFinish && !loading
                ? "linear-gradient(135deg, #00D2C8, #4040FF)"
                : "#94a3b8",
              boxShadow: canFinish && !loading ? "0 2px 12px rgba(64,64,255,0.3)" : "none",
            }}
          >
            {loading ? "Generando..." : "Terminar"}
          </button>
        </div>
      </div>
    </header>
  );
}
