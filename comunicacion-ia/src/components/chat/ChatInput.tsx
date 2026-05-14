import { useRef, useEffect } from "react";

interface Props {
  value: string;
  loading: boolean;
  listening: boolean;
  voiceInputAvailable: boolean;
  onChange: (text: string) => void;
  onSend: () => void;
  onToggleMic: () => void;
}

export function ChatInput({
  value,
  loading,
  listening,
  voiceInputAvailable,
  onChange,
  onSend,
  onToggleMic,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Recuperar el foco automáticamente cuando la IA termina de responder
  useEffect(() => {
    if (!loading && !listening) {
      inputRef.current?.focus();
    }
  }, [loading, listening]);

  function handleSend() {
    onSend();
    // Mantener foco inmediatamente al pulsar Enviar (antes de que loading arranque)
    inputRef.current?.focus();
  }

  return (
    <div className="bg-white border-t border-slate-200 px-6 py-4">
      <div className="max-w-2xl mx-auto flex gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={listening ? "Escuchando..." : "Escribe o pulsa el micrófono..."}
          disabled={loading || listening}
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50"
        />
        {voiceInputAvailable && (
          <button
            onClick={onToggleMic}
            disabled={loading}
            className={`px-4 py-2.5 rounded-xl font-medium transition disabled:opacity-40 ${
              listening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            title={listening ? "Detener" : "Hablar"}
          >
            🎤
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={loading || !value.trim() || listening}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Enviar
        </button>
      </div>
      <p className="text-xs text-slate-400 text-center mt-2">
        Necesitas al menos 3 mensajes para pedir feedback
      </p>
    </div>
  );
}