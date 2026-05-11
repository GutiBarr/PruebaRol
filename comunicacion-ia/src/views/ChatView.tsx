import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useChat } from "../hooks/useChat";
import { useVoice } from "../hooks/useVoice";
import { useTimer } from "../hooks/useTimer";
import { useObjectiveProgress } from "../hooks/useObjectiveProgress";
import { ChatHeader } from "../components/chat/ChatHeader";
import { ChatMessage } from "../components/chat/ChatMessage";
import { ChatInput } from "../components/chat/ChatInput";
import { ObjectivesSidebar } from "../components/chat/ObjectivesSidebar";
import { TypingIndicator } from "../components/chat/TypingIndicator";

export function ChatView() {
  const { scenario, reset, setSessionSeconds } = useStore();
  const [input, setInput] = useState("");

  const {
    messages,
    loading,
    messagesEndRef,
    sendUserMessage,
    finishAndGenerateFeedback,
    generateInitialMessage,
  } = useChat();

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
        setInput(failedText ?? "");
      }, 100);
    },
  });

  // ── Timer ──────────────────────────────────────
  const { formatted, seconds } = useTimer(true);

  useEffect(() => {
    setSessionSeconds(seconds);
  }, [seconds, setSessionSeconds]);
  // ───────────────────────────────────────────────

  // ── Generar primer mensaje si está vacío ────────
  useEffect(() => {
    if (messages.length === 0 && !loading && (!scenario?.frase_inicial || scenario.frase_inicial.trim() === '')) {
      generateInitialMessage();
    }
  }, [messages.length, loading, scenario?.frase_inicial, generateInitialMessage]);
  // ───────────────────────────────────────────────

  // ── Progreso de objetivos ──────────────────────
  const objetivosConProgreso = useObjectiveProgress(
    scenario?.objetivos ?? [],
    messages
  );
  // ───────────────────────────────────────────────

  async function handleSend() {
    const textoEnviado = input;
    setInput("");
    const failedText = await sendUserMessage(textoEnviado);
    if (failedText) setInput(failedText);
  }

  if (!scenario) return null;

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      <ChatHeader
        scenario={scenario}
        voiceMode={voiceMode}
        voiceOutputAvailable={voiceOutputAvailable}
        loading={loading}
        canFinish={messages.length >= 3}
        onBack={reset}
        onToggleVoice={toggleVoiceMode}
        onFinish={finishAndGenerateFeedback}
        sessionTime={formatted}
      />

      <div className="flex-1 flex overflow-hidden">
        <ObjectivesSidebar objetivos={objetivosConProgreso} />

        <div className="flex-1 flex flex-col overflow-hidden">

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((m, i) => (
                <ChatMessage key={i} message={m} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <ChatInput
            value={input}
            loading={loading}
            listening={listening}
            voiceInputAvailable={voiceInputAvailable}
            onChange={setInput}
            onSend={handleSend}
            onToggleMic={toggleMic}
          />
        </div>
      </div>
    </div>
  );
}
