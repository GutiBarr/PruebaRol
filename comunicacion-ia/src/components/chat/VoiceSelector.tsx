import { useEffect, useState } from "react";
import { useStore } from "../../store/useStore";
import { getSpanishVoices, onVoicesLoaded, speak } from "../../services/voiceService";

export function VoiceSelector() {
  const { selectedVoiceURI, setSelectedVoiceURI } = useStore();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    onVoicesLoaded(() => {
      setVoices(getSpanishVoices());
    });
  }, []);

  if (voices.length === 0) return null;

  function handleChange(uri: string) {
    setSelectedVoiceURI(uri);
    // Pequeña muestra de la voz al cambiarla
    speak("Hola, esta es mi voz.", uri);
  }

  return (
    <select
      value={selectedVoiceURI || ""}
      onChange={(e) => handleChange(e.target.value)}
      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[180px]"
      title="Elegir voz de la IA"
    >
      <option value="">Voz por defecto</option>
      {voices.map((v) => (
        <option key={v.voiceURI} value={v.voiceURI}>
          {v.name}
        </option>
      ))}
    </select>
  );
}