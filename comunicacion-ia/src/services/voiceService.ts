// src/services/voiceService.ts
// Reconocimiento y síntesis de voz con Web Speech API

// TypeScript no tiene tipos oficiales para SpeechRecognition, los declaramos aquí
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
  recognition.continuous = false; // se detiene al dejar de hablar
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

// Intenta encontrar una voz en español femenina (suele sonar mejor para role-play)
function pickSpanishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // Prioridad: voces españolas "naturales" (Google, Microsoft neurales)
  const preferred = voices.find(
    (v) => v.lang.startsWith("es") && /google|natural|premium/i.test(v.name)
  );
  if (preferred) return preferred;
  // Si no, cualquier voz en español
  return voices.find((v) => v.lang.startsWith("es")) || null;
}

export function speak(text: string, onEnd?: () => void) {
  if (!isVoiceOutputAvailable()) return;
  // Cancela si ya estaba hablando
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  const voice = pickSpanishVoice();
  if (voice) utterance.voice = voice;

  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isVoiceOutputAvailable()) {
    window.speechSynthesis.cancel();
  }
}