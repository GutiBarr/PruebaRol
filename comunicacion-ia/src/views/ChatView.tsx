import { useState } from "react";
import { useStore } from "../store/useStore";
import { useChat } from "../hooks/useChat";
import { useVoice } from "../hooks/useVoice";

export function ChatView() {
  const { scenario, reset } = useStore();
  const [input, setInput] = useState("");

  const { messages, loading, messagesEndRef, sendUserMessage, finishAndGenerateFeedback } = useChat();

  const {
    listening,
    voiceMode,
    toggleVoiceMode,
    toggleMic,
    voiceInputAvailable,
    voiceOutputAvailable,
  } = useVoice({
    onSpeechResult: async (text) => {
      setInput(text);
      setTimeout(async () => {
        const failedText = await sendUserMessage(text);
        if (failedText) setInput(failedText);
        else setInput("");
      }, 100);
    },
  });

  async function handleSend() {
    const textoEnviado = input;
    setInput("");
    const failedText = await sendUserMessage(textoEnviado);
    if (failedText) setInput(failedText);
  }

  if (!scenario) return null;

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="text-slate-400 hover:text-slate-700 transition"
            title="Salir"
          >
            ←
          </button>
          <div>
            <h2 className="font-semibold text-slate-900">{scenario.titulo}</h2>
            <p className="text-xs text-slate-500">
              {scenario.rolUsuario} <span className="text-slate-300 mx-1">·</span> vs <span className="text-slate-300 mx-1">·</span> {scenario.rolIA}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {voiceOutputAvailable && (
            <button
              onClick={toggleVoiceMode}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition ${
                voiceMode
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              title="Activar/desactivar voz de la IA"
            >
              <span>{voiceMode ? "🔊" : "🔇"}</span>
              <span className="hidden md:inline">{voiceMode ? "Voz activa" : "Voz apagada"}</span>
            </button>
          )}
          <button
            onClick={finishAndGenerateFeedback}
            disabled={messages.length < 3 || loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Terminar y ver feedback
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden md:block w-72 bg-white border-r border-slate-200 p-5 overflow-y-auto">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            🎯 Objetivos
          </h3>
          <ul className="space-y-3">
            {scenario.objetivos.map((o, i) => (
              <li key={o.id} className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs text-slate-600 leading-relaxed">{o.descripcion}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex msg-enter ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                      IA
                    </div>
                  )}
                  <div
                    className={`max-w-md px-4 py-2.5 rounded-2xl leading-relaxed ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 msg-enter">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                    IA
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1">
                    <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block"></span>
                    <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block"></span>
                    <span className="typing-dot w-2 h-2 bg-slate-400 rounded-full inline-block"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="bg-white border-t border-slate-200 px-6 py-4">
            <div className="max-w-2xl mx-auto flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={listening ? "Escuchando..." : "Escribe o pulsa el micrófono..."}
                disabled={loading || listening}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50"
              />
              {voiceInputAvailable && (
                <button
                  onClick={toggleMic}
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
                disabled={loading || !input.trim() || listening}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Enviar
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              Necesitas al menos 3 mensajes para pedir feedback
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}