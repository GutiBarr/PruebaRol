// src/hooks/useChat.ts
// Encapsula toda la lógica del chat: enviar mensajes, generar feedback, manejar errores.

import { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { sendMessage, generateFeedback } from "../services/groqService";

export function useChat() {
  const { scenario, messages, loading } = useStore();
  const { addMessage, setFeedback, setLoading } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Traduce errores técnicos a mensajes claros para el usuario
  function getErrorMessage(error: unknown): string {
    const msg = (error as Error).message;
    if (msg.includes("503")) return "La IA está saturada. Espera unos segundos y reintenta.";
    if (msg.includes("429")) return "Has superado el límite de uso. Espera un momento.";
    if (msg.includes("401") || msg.includes("403")) return "Problema de autenticación con la IA.";
    return "Error al contactar con la IA. Inténtalo de nuevo.";
  }

  // Envía un mensaje al chat. Recupera el texto si falla para que el usuario pueda reintentar.
  async function sendUserMessage(text: string): Promise<string | null> {
    if (!text.trim() || !scenario || loading) return null;

    // Evitar duplicados si el último mensaje es idéntico y fue enviado hace muy poco
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "user" && lastMessage.content === text.trim()) {
      return null;
    }

    const userMessage = { role: "user" as const, content: text.trim() };
    addMessage(userMessage);
    setLoading(true);

    try {
      const response = await sendMessage(scenario.system_prompt, [...messages, userMessage]);
      addMessage({ role: "assistant", content: response });
      return null; // sin error
    } catch (error) {
      console.error(error);
      // Quitamos el mensaje del usuario del historial para que pueda reintentar
      useStore.setState((s) => ({ messages: s.messages.slice(0, -1) }));
      alert(getErrorMessage(error));
      return text; // devolvemos el texto para que el caller lo restaure en el input
    } finally {
      setLoading(false);
    }
  }

  // Genera el feedback final de la conversación
  async function finishAndGenerateFeedback() {
    if (!scenario || messages.length < 2) return;
    setLoading(true);
    try {
      const displayObjectives = (scenario as any).scenario_objectives || (scenario as any).objetivos || [];
      const fb = await generateFeedback(scenario.descripcion, displayObjectives, messages);
      setFeedback(fb);
    } catch (error) {
      console.error(error);
      alert("Error al generar el feedback");
    } finally {
      setLoading(false);
    }
  }

  // Genera un mensaje inicial automático cuando la frase inicial está vacía
  async function generateInitialMessage() {
    if (!scenario || loading) return;
    setLoading(true);
    try {
      // Enviamos un mensaje oculto para que la IA inicie
      const response = await sendMessage(scenario.system_prompt, [
        { role: "user", content: "Empieza la simulación. Di tu primera frase y actúa estrictamente según tu rol y contexto. (Este es un mensaje automático del sistema, no lo menciones)." }
      ]);
      addMessage({ role: "assistant", content: response });
    } catch (error) {
      console.error(error);
      alert(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return {
    messages,
    loading,
    messagesEndRef,
    sendUserMessage,
    finishAndGenerateFeedback,
    generateInitialMessage,
  };
}