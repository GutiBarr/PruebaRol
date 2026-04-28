import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import {
  isVoiceInputAvailable,
  isVoiceOutputAvailable,
  createRecognizer,
  speak,
  stopSpeaking,
} from "../services/voiceService";

interface UseVoiceOptions {
  onSpeechResult?: (text: string) => void;
}

export function useVoice({ onSpeechResult }: UseVoiceOptions = {}) {
  const { view, messages, voiceMode, toggleVoiceMode, selectedVoiceURI } = useStore();
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef<ReturnType<typeof createRecognizer> | null>(null);

  useEffect(() => {
    if (!voiceMode) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") {
      speak(lastMessage.content, selectedVoiceURI);
    }
  }, [messages, voiceMode, selectedVoiceURI]);

  useEffect(() => {
    if (!voiceMode || view !== "chat") stopSpeaking();
  }, [voiceMode, view]);

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
      (text) => onSpeechResult?.(text),
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

  return {
    listening,
    voiceMode,
    toggleVoiceMode,
    toggleMic,
    voiceInputAvailable: isVoiceInputAvailable(),
    voiceOutputAvailable: isVoiceOutputAvailable(),
  };
}