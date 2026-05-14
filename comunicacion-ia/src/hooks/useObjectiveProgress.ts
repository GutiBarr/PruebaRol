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
    // 1. Intentar por ID (objetivos predefinidos)
    let keywords = KEYWORDS[obj.id] ?? [];
    
    // 2. Fallback: Si no hay keywords por ID, intentar extraerlas de la descripción
    if (keywords.length === 0 && obj.descripcion) {
      // Extraemos palabras de más de 4 letras que no sean conectores comunes
      // Limitamos a las primeras 5 palabras significativas para que la barra avance a buen ritmo
      const words = obj.descripcion.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
        .split(/\s+/)
        .filter(w => w.length > 4 && !['sobre', 'desde', 'hasta', 'entre', 'donde', 'cuando'].includes(w))
        .slice(0, 5); 
      
      keywords = [...new Set(words)]; 
    }

    const matched = keywords.filter((kw) => {
      // Usamos la raíz de la palabra (primeras 4-5 letras) para mayor flexibilidad
      // Ejemplo: "acept" coincidirá con "acepto", "aceptamos", "aceptar", etc.
      const root = kw.length > 4 ? kw.substring(0, 4) : kw;
      return userText.includes(root);
    });

    const progress = keywords.length === 0 ? 0 : matched.length / keywords.length;
    
    return {
      ...obj,
      progress: Math.min(progress, 1),        // 0 a 1
      inProgress: progress > 0 && progress < 0.3,
      likelyCumplido: progress >= 0.3, // Bajamos el umbral para que sea más sensible
    };
  });
}