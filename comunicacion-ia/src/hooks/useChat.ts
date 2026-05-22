// src/hooks/useChat.ts
// Encapsula toda la lógica del chat: enviar mensajes, generar feedback, manejar errores.

import { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { sendMessage, generateFeedback } from "../services/groqService";
import { dbService } from "../services/dbService";

export function useChat() {
  const { scenario, messages, loading, currentSessionId, userProfile } = useStore();
  const { addMessage, setFeedback, setLoading, setSessionId } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSaving = useRef(false);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // --- AUTO-GUARDADO ---
  const lastSavedMessagesJson = useRef("");

  useEffect(() => {
    async function autoSave() {
      if (!scenario || messages.length === 0 || !userProfile || isSaving.current) return;

      // Evitar guardar si los mensajes no han cambiado realmente (comparación profunda simple)
      const currentMessagesJson = JSON.stringify(messages);
      if (currentMessagesJson === lastSavedMessagesJson.current) return;

      try {
        isSaving.current = true;
        const newId = await dbService.savePartialSession({
          session_id: currentSessionId,
          scenario_id: scenario.id,
          messages: messages,
          azure_oid: userProfile.azure_oid
        });

        lastSavedMessagesJson.current = currentMessagesJson;

        if (newId && newId !== currentSessionId) {
          setSessionId(newId);
        }
      } catch (error) {
        console.error("Error in auto-save:", error);
      } finally {
        isSaving.current = false;
      }
    }

    // Guardamos cuando hay cambios en los mensajes y no estamos esperando a la IA
    if (!loading && messages.length > 0) {
      const timer = setTimeout(autoSave, 500); // Debounce de 500ms
      return () => clearTimeout(timer);
    }
  }, [messages, loading, scenario, userProfile, currentSessionId, setSessionId]);

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
    const currentState = useStore.getState();
    const currentScenario = currentState.scenario;
    const currentMessages = currentState.messages;
    const profile = currentState.userProfile;
    const _sessionIdToCleanup = currentState.currentSessionId;

    if (!currentScenario || currentMessages.length < 2 || !profile) return;

    setLoading(true);
    isSaving.current = true; // BLOQUEO 1: Evitamos que el auto-guardado interfiera durante el cierre

    try {
      const displayObjectives = currentScenario.objetivos || [];
      const fb = await generateFeedback(currentScenario.descripcion, displayObjectives, currentMessages);

      // Limpiamos mensajes para el historial oficial (evitando vacíos)
      const validMessages = currentMessages
        .filter(m => m.content && m.content.trim() !== '')
        .map(m => ({ role: m.role, content: m.content.trim() }));

      try {
        await dbService.saveCompleteSession({
          scenario_id: currentScenario.id,
          duration_seconds: currentState.sessionSeconds,
          puntuacion: fb.puntuacion,
          resumen: fb.resumen,
          feedback_raw: fb,
          messages: validMessages,
          objective_results: fb.objetivos.map(fbObj => {
            const originalObj = displayObjectives.find((o: any) => o.id === fbObj.id || o.slug === fbObj.id);
            return {
              objective_id: originalObj?.id,
              cumplido: fbObj.cumplido,
              comentario: fbObj.comentario,
              ejemplo: fbObj.ejemplo
            };
          }).filter(res => !!res.objective_id),
          azure_oid: profile.azure_oid
        });
      } catch (dbError) {
        console.error("Error al guardar en historial:", dbError);
      }

      // LIMPIEZA TOTAL: Borramos cualquier sesión pendiente para que no haya duplicados
      setSessionId(null);
      await dbService.cleanupPendingSessions(currentScenario.id, profile.azure_oid).catch(console.error);

      setFeedback(fb);
    } catch (error) {
      console.error("Error crítico en finalización:", error);
      alert("Error al finalizar la sesión");
    } finally {
      setLoading(false);
      isSaving.current = false; // Liberamos el bloqueo
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
