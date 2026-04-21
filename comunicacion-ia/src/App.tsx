import { useState, useEffect, useRef } from "react";
import { useStore } from "./store/useStore";
import { scenarios } from "./data/scenarios";
import { sendMessage, generateFeedback } from "./services/aiService";
import {
  isVoiceInputAvailable,
  isVoiceOutputAvailable,
  createRecognizer,
  speak,
  stopSpeaking,
} from "./services/voiceService";

export default function App() {
  const { view, scenario, messages, feedback, loading } = useStore();
  const { selectScenario, startChat, addMessage, setFeedback, setLoading, reset } = useStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const voiceMode = useStore((s) => s.voiceMode);
  const toggleVoiceMode = useStore((s) => s.toggleVoiceMode);
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef<ReturnType<typeof createRecognizer> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Cuando la IA responde, si el modo voz está activado, habla
  useEffect(() => {
    if (!voiceMode) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") {
      speak(lastMessage.content);
    }
  }, [messages, voiceMode]);

  // Al salir del chat o desactivar voz, para la voz
  useEffect(() => {
    if (!voiceMode || view !== "chat") stopSpeaking();
  }, [voiceMode, view]);

  // Iniciar/parar escucha del micrófono
 // Iniciar/parar escucha del micrófono
  function toggleMic() {
    if (listening) {
      recognizerRef.current?.stop();
      return;
    }
    if (!isVoiceInputAvailable()) {
      alert("Tu navegador no soporta reconocimiento de voz. Prueba con Chrome o Edge.");
      return;
    }
    stopSpeaking();
    const rec = createRecognizer(
      (text) => {
        setInput(text);
        // Enviar automáticamente cuando se termina de hablar
        setTimeout(() => handleSendText(text), 100);
      },
      () => setListening(false),
      (err) => {
        console.error("Error de reconocimiento:", err);
        setListening(false);
      }
    );
    recognizerRef.current = rec;
    rec.start();
    setListening(true);
  }

  // Envía un mensaje específico (usado por el micrófono para enviar al terminar de hablar)
  async function handleSendText(text: string) {
    if (!text.trim() || !scenario || loading) return;
    const userMessage = { role: "user" as const, content: text };
    addMessage(userMessage);
    setInput("");
    setLoading(true);

    try {
      const response = await sendMessage(scenario.systemPrompt, [...messages, userMessage]);
      addMessage({ role: "assistant", content: response });
    } catch (error) {
      console.error(error);
      const msg = (error as Error).message;
      let userMsg = "Error al contactar con la IA. Inténtalo de nuevo.";
      if (msg.includes("503")) userMsg = "La IA está saturada. Espera unos segundos y reintenta.";
      else if (msg.includes("429")) userMsg = "Has superado el límite de uso. Espera un momento.";
      alert(userMsg);
      useStore.setState((s) => ({ messages: s.messages.slice(0, -1) }));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    handleSendText(input);
  }

  async function handleFinish() {
    if (!scenario || messages.length < 2) return;
    setLoading(true);
    try {
      const fb = await generateFeedback(scenario.descripcion, scenario.objetivos, messages);
      setFeedback(fb);
    } catch (error) {
      console.error(error);
      alert("Error al generar el feedback");
    } finally {
      setLoading(false);
    }
  }

  // ─── VISTA 1: Landing / Selector ─────────────────────────────────
  if (view === "selector") {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                R
              </div>
              <span className="font-semibold text-slate-900">RolePlay Stemdo</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <span className="hidden md:block">Plataforma de entrenamiento</span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Activo
              </span>
            </div>
          </div>
        </nav>

        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-slate-50"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm text-slate-700 px-3 py-1.5 rounded-full text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                Impulsado por IA generativa
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.05]">
                Entrena conversaciones <br />
                <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                  que marcan la diferencia
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                Practica situaciones reales de trabajo con una IA que se adapta a ti.
                Recibe feedback inmediato sobre tus puntos fuertes y áreas a mejorar.
              </p>
              <a
                href="#escenarios"
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition shadow-lg shadow-slate-900/10"
              >
                Empezar a practicar
                <span>↓</span>
              </a>
            </div>

            <div className="mt-20 grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-slate-900">{scenarios.length}</div>
                <div className="text-xs md:text-sm text-slate-500 mt-1">Escenarios listos</div>
              </div>
              <div className="text-center border-x border-slate-200">
                <div className="text-3xl md:text-4xl font-bold text-slate-900">∞</div>
                <div className="text-xs md:text-sm text-slate-500 mt-1">Práctica ilimitada</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-slate-900">100%</div>
                <div className="text-xs md:text-sm text-slate-500 mt-1">Feedback personalizado</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white border-y border-slate-200">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                Cómo funciona
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Tres pasos para mejorar
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { n: 1, t: "Elige un escenario", d: "Selecciona la situación que quieres practicar: cliente difícil, entrevista, negociación…" },
                { n: 2, t: "Conversa con la IA", d: "La IA hace su papel de forma realista. Responde como lo harías en la situación real." },
                { n: 3, t: "Recibe tu feedback", d: "Obtén una evaluación detallada por objetivos, con sugerencias concretas para mejorar." },
              ].map((p) => (
                <div key={p.n} className="relative">
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-lg mb-4">
                    {p.n}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 text-lg">{p.t}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{p.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="escenarios" className="py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
              <div>
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                  Catálogo
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Escenarios disponibles
                </h2>
              </div>
              <div className="text-sm text-slate-500">
                {scenarios.length} disponibles
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {scenarios.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => selectScenario(s)}
                  className="group text-left bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-indigo-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-slate-400">
                        #{String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                        →
                      </span>
                    </div>

                    <h3 className="font-bold text-xl text-slate-900 mb-2">
                      {s.titulo}
                    </h3>
                    <p className="text-slate-600 text-sm mb-5 leading-relaxed">
                      {s.descripcion}
                    </p>

                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-5">
                      <div className="text-xs text-slate-400 mb-1">La IA te dirá:</div>
                      <p className="text-sm text-slate-700 italic line-clamp-2">
                        "{s.frasenicial}"
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs pt-4 border-t border-slate-100">
                      <div>
                        <div className="text-slate-400">Tu rol</div>
                        <div className="font-semibold text-slate-700 mt-0.5">{s.rolUsuario}</div>
                      </div>
                      <div className="w-px h-8 bg-slate-200"></div>
                      <div>
                        <div className="text-slate-400">Rol de la IA</div>
                        <div className="font-semibold text-slate-700 mt-0.5">{s.rolIA}</div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-slate-500">
            RolePlay AI · Entrena tus habilidades de comunicación con IA
          </div>
        </footer>
      </div>
    );
  }

  // ─── VISTA 2: Briefing ─────────────────────────────────
  if (view === "briefing" && scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <button
            onClick={reset}
            className="text-sm text-slate-500 hover:text-slate-900 mb-6 flex items-center gap-1 transition"
          >
            ← Volver a escenarios
          </button>

          <div className="mb-8">
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
              Briefing
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
              {scenario.titulo}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-full text-sm">
                <span className="text-slate-400 text-xs">Tú</span>
                <strong className="text-slate-700">{scenario.rolUsuario}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-full text-sm">
                <span className="text-slate-400 text-xs">IA</span>
                <strong className="text-slate-700">{scenario.rolIA}</strong>
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-4">
            <h2 className="font-semibold mb-3 text-slate-900 flex items-center gap-2">
              <span className="text-lg">📋</span> Contexto
            </h2>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">
              {scenario.contexto}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h2 className="font-semibold mb-4 text-slate-900 flex items-center gap-2">
              <span className="text-lg">🎯</span> Objetivos de la sesión
            </h2>
            <ul className="space-y-3">
              {scenario.objetivos.map((o, i) => (
                <li key={o.id} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-slate-700 leading-relaxed">{o.descripcion}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={startChat}
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
          >
            Empezar conversación →
          </button>
        </div>
      </div>
    );
  }

  // ─── VISTA 3: Chat ─────────────────────────────────
  if (view === "chat" && scenario) {
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
            {isVoiceOutputAvailable() && (
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
              onClick={handleFinish}
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
                {isVoiceInputAvailable() && (
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

  // ─── VISTA 4: Feedback ─────────────────────────────────
  if (view === "feedback" && feedback) {
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

  return null;
}