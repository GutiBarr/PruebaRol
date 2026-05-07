// src/services/voiceService.ts
// Reconocimiento y síntesis de voz con Web Speech API

interface SpeechRecognitionEvent {
  results: {
    [key: number]: { [key: number]: { transcript: string } };
    length: number;
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

const w = window as WindowWithSpeech;
const SpeechRecognitionClass = w.SpeechRecognition || w.webkitSpeechRecognition;

// ─── Reconocimiento (voz → texto) ─────────────────

export function isVoiceInputAvailable(): boolean {
  return !!SpeechRecognitionClass;
}

export function createRecognizer(
  onResult: (text: string) => void,
  onEnd: () => void,
  onError: (error: string) => void
) {
  if (!SpeechRecognitionClass) {
    throw new Error("El navegador no soporta reconocimiento de voz");
  }

  const recognition = new SpeechRecognitionClass();
  recognition.lang = "es-ES";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    onResult(text);
  };

  recognition.onend = onEnd;
  recognition.onerror = (event) => onError(event.error);

  return recognition;
}

// ─── Síntesis (texto → voz) ─────────────────

export function isVoiceOutputAvailable(): boolean {
  return "speechSynthesis" in window;
}

// Devuelve solo las voces en español disponibles en el navegador
export function getSpanishVoices(): SpeechSynthesisVoice[] {
  if (!isVoiceOutputAvailable()) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("es"));
}

// Las voces tardan en cargar la primera vez. Esta función nos avisa cuando estén listas.
export function onVoicesLoaded(callback: () => void) {
  if (!isVoiceOutputAvailable()) return;
  // Si ya están cargadas, llamamos directamente
  if (window.speechSynthesis.getVoices().length > 0) {
    callback();
    return;
  }
  // Si no, esperamos al evento
  window.speechSynthesis.onvoiceschanged = () => callback();
}

// Encuentra una voz por su URI (identificador único)
function findVoiceByURI(uri: string | null): SpeechSynthesisVoice | null {
  if (!uri) return null;
  return window.speechSynthesis.getVoices().find((v) => v.voiceURI === uri) || null;
}

// Voz por defecto si no hay ninguna seleccionada
function pickDefaultSpanishVoice(): SpeechSynthesisVoice | null {
  const voices = getSpanishVoices();
  // Prioridad: voces neurales/naturales (suenan mejor)
  const preferred = voices.find((v) => /natural|neural|premium|google/i.test(v.name));
  if (preferred) return preferred;
  return voices[0] || null;
}

export function speak(text: string, voiceURI: string | null = null, onEnd?: () => void) {
  if (!isVoiceOutputAvailable()) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  const voice = findVoiceByURI(voiceURI) || pickDefaultSpanishVoice();
  if (voice) utterance.voice = voice;

  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isVoiceOutputAvailable()) {
    window.speechSynthesis.cancel();
  }
}