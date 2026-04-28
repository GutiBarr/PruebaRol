import type { Objetivo } from "../data/scenarios";
import type { Message } from "../services/groqService";

// Palabras clave por objetivo ID — ajústalas a tus escenarios
const KEYWORDS: Record<string, string[]> = {
  "empatia":         ["entiendo", "comprendo", "lamento", "disculpa", "lo siento", "frustración"],
  "no-excusas":      ["solución", "vamos a", "lo que podemos hacer", "me comprometo"],
  "solucion-concreta":["semanas", "días", "fecha", "entregamos", "plazo", "listo para"],
  "compromiso":      ["reunión", "llamo", "email", "seguimiento", "contacto", "confirmo"],
  "presentacion":    ["me llamo", "soy", "estudié", "mi proyecto", "formación"],
  "honestidad":      ["no sé", "no tengo experiencia", "estoy aprendiendo", "desconozco"],
  "ejemplos":        ["por ejemplo", "en mi proyecto", "cuando hice", "trabajé en"],
  "preguntas":       ["¿", "cómo es", "qué esperáis", "cuál es el"],
  "datos-concretos": ["%", "proyecto", "migración", "módulo", "cerré", "entregué"],
  "valor-aportado":  ["ahorré", "mejoré", "reduje", "impacto", "resultado", "beneficio"],
  "cifra-clara":     ["10%", "15%", "aumento", "subida", "euros", "rango"],
  "cierre":          ["próximo paso", "quedamos", "me confirmas", "agendamos", "acuerdo"],
};

export function useObjectiveProgress(objetivos: Objetivo[], messages: Message[]) {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  return objetivos.map((obj) => {
    const keywords = KEYWORDS[obj.id] ?? [];
    const matched = keywords.filter((kw) => userText.includes(kw));
    const progress = keywords.length === 0 ? 0 : matched.length / keywords.length;
    return {
      ...obj,
      progress: Math.min(progress, 1),        // 0 a 1
      inProgress: progress > 0 && progress < 0.6,
      likelyCumplido: progress >= 0.6,
    };
  });
}