import { useState } from "react";
import { useStore } from "../store/useStore";
import { useChat } from "../hooks/useChat";
import { useVoice } from "../hooks/useVoice";
import { ChatHeader } from "../components/chat/ChatHeader";
import { ChatMessage } from "../components/chat/ChatMessage";
import { ChatInput } from "../components/chat/ChatInput";
import { ObjectivesSidebar } from "../components/chat/ObjectivesSidebar";
import { TypingIndicator } from "../components/chat/TypingIndicator";

export function ChatView() {
  const { scenario, reset } = useStore();
  const [input, setInput] = useState("");

  const {
    messages,
    loading,
    messagesEndRef,
    sendUserMessage,
    finishAndGenerateFeedback,
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
      />

      <div className="flex-1 flex overflow-hidden">
        <ObjectivesSidebar objetivos={scenario.objetivos} />

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