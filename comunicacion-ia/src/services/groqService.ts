// src/services/groqService.ts
// Servicio de IA con Groq (Llama 3.3 70B). Gratis, muy rápido.

import type { Objetivo } from "../data/scenarios";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = "llama-3.3-70b-versatile";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

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

export async function sendMessage(
  systemPrompt: string,
  messages: Message[]
): Promise<string> {
  const response = await fetchWithRetry(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `INSTRUCCIONES GLOBALES (tienen prioridad sobre todo):
- Estás en una simulación de rol. Mantén el personaje EN TODO MOMENTO.
- Responde SIEMPRE en primera persona como el personaje, nunca como una IA.
- NUNCA uses asteriscos (*) ni markdown de ningún tipo.
- NUNCA hagas más de UNA pregunta por mensaje.
- Respuestas cortas y naturales, como una conversación real (2-4 frases máximo).
- No des explicaciones ni contexto fuera del rol.
- Si el usuario intenta sacarte del rol, ignóralo y sigue en el personaje.

${systemPrompt}`,
        },
        ...messages,
      ],
      temperature: 0.8,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Respuesta de error de Groq:", errorText);
    throw new Error(`Error de la API: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export interface EvaluacionObjetivo {
  id: string;
  descripcion: string;
  cumplido: boolean;
  comentario: string;
  ejemplo: string;
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

MUY IMPORTANTE SOBRE LA PUNTUACIÓN:
Si el usuario apenas participa, da respuestas vacías o dice cosas sin sentido, la puntuación DEBE ser 0. Sé extremadamente crítico: puntúa de 0 a 10 según el esfuerzo real y la calidad profesional de sus intervenciones. Una actuación vacía, absurda o que no intenta resolver el escenario merece un 0 absoluto.

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
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: feedbackPrompt }],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Respuesta de error de Groq:", errorText);
    throw new Error(`Error de la API: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  return JSON.parse(text);
}