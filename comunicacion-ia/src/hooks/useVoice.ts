// src/hooks/useVoice.ts
// Encapsula toda la lógica de voz: micrófono (voz→texto) y altavoz (texto→voz de la IA).

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
  // Callback que se ejecuta cuando el usuario termina de hablar (para enviar el mensaje)
  onSpeechResult?: (text: string) => void;
}

export function useVoice({ onSpeechResult }: UseVoiceOptions = {}) {
  const { view, messages, voiceMode, toggleVoiceMode } = useStore();
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef<ReturnType<typeof createRecognizer> | null>(null);

  // Cuando la IA responde, si el modo voz está activo, habla
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
        // Dispara el callback con el texto reconocido (para enviar directamente)
        onSpeechResult?.(text);
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

  return {
    listening,
    voiceMode,
    toggleVoiceMode,
    toggleMic,
    voiceInputAvailable: isVoiceInputAvailable(),
    voiceOutputAvailable: isVoiceOutputAvailable(),
  };
}