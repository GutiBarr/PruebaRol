// src/services/aiService.ts
import type { Objetivo } from "../data/scenarios";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY; // [cite: 1]
const MODEL = "llama-3.3-70b-versatile"; // Modelo potente y rápido de Groq
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
      return response;
    }
    const wait = Math.pow(2, i) * 1000;
    await new Promise((r) => setTimeout(r, wait));
  }
  return fetch(url, options);
}

export async function sendMessage(systemPrompt: string, messages: Message[]): Promise<string> {
  const response = await fetchWithRetry(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.8,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export interface Feedback {
  puntuacion: number;
  objetivos: any[];
  resumen: string;
}

export async function generateFeedback(
  scenarioContext: string,
  objetivos: Objetivo[],
  conversation: Message[]
): Promise<Feedback> {
  const objetivosTexto = objetivos
    .map((o) => `- ${o.id}: ${o.descripcion}`)
    .join("\n");

  const feedbackPrompt = `Analiza la conversación de role-play. 
  Contexto: ${scenarioContext}
  Objetivos: ${objetivosTexto}
  Conversación: ${conversation.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

  Responde estrictamente con un JSON que contenga: puntuacion (número), objetivos (array con id, descripcion, cumplido, comentario, ejemplo) y resumen (string).`;

  const response = await fetchWithRetry(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "Eres un evaluador profesional. Solo respondes en formato JSON puro." },
        { role: "user", content: feedbackPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Menor temperatura = menos errores en el JSON
    }),
  });

  // 1. Validar si la respuesta de Groq fue exitosa
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error en Groq API:", errorText);
    throw new Error("No se pudo generar el feedback");
  }

  const data = await response.json();
  
  // 2. Extraer el contenido
  let content = data.choices[0].message.content;

  // 3. LIMPIEZA CRUCIAL: Elimina markdown si la IA lo incluyó
  content = content.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Error al parsear el JSON de Groq. Contenido recibido:", content);
    throw new Error("La respuesta de la IA no es un JSON válido");
  }
}