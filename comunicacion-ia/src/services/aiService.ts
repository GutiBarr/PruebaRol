// src/services/aiService.ts
// Servicio de IA con Google Gemini. Cambiar de proveedor = modificar este archivo.

import type { Objetivo } from "../data/scenarios";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

export interface Message {
  role: "user" | "assistant";
  content: string;
}

// Reintenta automáticamente si hay errores temporales (503, 429, etc.)
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 5
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    if (
      response.ok ||
      (response.status >= 400 && response.status < 500 && response.status !== 429)
    ) {
      return response;
    }
    if (i === maxRetries - 1) return response;
    const wait = Math.pow(2, i) * 1000;
    console.log(`Error ${response.status}, reintentando en ${wait}ms...`);
    await new Promise((r) => setTimeout(r, wait));
  }
  throw new Error("No debería llegar aquí");
}

// Convierte nuestros mensajes al formato que espera Gemini
function toGeminiFormat(messages: Message[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

// Envía la conversación y devuelve la respuesta de la IA (manteniendo el rol)
export async function sendMessage(
  systemPrompt: string,
  messages: Message[]
): Promise<string> {
  const response = await fetchWithRetry(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: toGeminiFormat(messages),
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Respuesta de error de Gemini:", errorText);
    throw new Error(`Error de la API: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Evaluación por cada objetivo
export interface EvaluacionObjetivo {
  id: string;
  descripcion: string;
  cumplido: boolean;
  comentario: string; // qué hizo bien / qué podría haber hecho mejor
  ejemplo: string; // frase concreta que podría haber dicho (vacío si cumplió)
}

export interface Feedback {
  puntuacion: number;
  objetivos: EvaluacionObjetivo[];
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

  const feedbackPrompt = `Eres un coach experto en comunicación profesional. Analiza la siguiente conversación de role-play.

Contexto del escenario: ${scenarioContext}

Objetivos que el usuario debía cumplir:
${objetivosTexto}

Conversación:
${conversation.map((m) => `${m.role === "user" ? "Usuario" : "IA"}: ${m.content}`).join("\n\n")}

Evalúa el desempeño del usuario (no de la IA) objetivo por objetivo. Sé riguroso: solo marca "cumplido: true" si realmente cumplió con claridad.

Responde SOLO con un JSON válido, sin markdown ni texto adicional, con esta estructura:
{
  "puntuacion": <número del 1 al 10>,
  "objetivos": [
    {
      "id": "<id del objetivo>",
      "descripcion": "<descripcion del objetivo>",
      "cumplido": <true o false>,
      "comentario": "<2 frases explicando qué hizo bien o por qué no cumplió>",
      "ejemplo": "<si no cumplió: una frase concreta que podría haber dicho. Si cumplió: cadena vacía>"
    }
  ],
  "resumen": "<2-3 frases de valoración general>"
}`;

  const response = await fetchWithRetry(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: feedbackPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4, // más bajo = evaluación más consistente
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Respuesta de error de Gemini:", errorText);
    throw new Error(`Error de la API: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text);
}