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

  const feedbackPrompt = `Eres un coach experto en comunicación profesional y psicología organizacional. Analiza con rigor la siguiente conversación de role-play.

Contexto del escenario: ${scenarioContext}

Objetivos que el usuario debía cumplir:
${objetivosTexto}

Conversación completa:
${conversation.map((m) => `${m.role === "user" ? "USUARIO" : "IA"}: ${m.content}`).join("\n\n")}

Tu tarea es evaluar el desempeño del usuario (no de la IA) con total honestidad.

SISTEMA DE PUNTUACIÓN (0-10):
- 0: El usuario no ha participado, ha dado respuestas absurdas, vacías o ha ignorado totalmente el contexto profesional.
- 1-4: Participación muy pobre. No se han cumplido los objetivos principales. Comunicación poco profesional o ineficaz.
- 5-6: Desempeño mediocre. Ha intentado resolver la situación pero con fallos importantes de comunicación o dejando objetivos clave sin tocar. (EVITA ESTA NOTA si el usuario ha hecho un esfuerzo real).
- 7-8: Buen desempeño. Se nota profesionalidad y se han cumplido la mayoría de objetivos de forma satisfactoria.
- 9-10: Excelente. Comunicación impecable, empatía, resolución de conflictos y cumplimiento total de objetivos.

MUY IMPORTANTE:
1. No seas blando. Si el usuario lo ha hecho mal, puntúa bajo. Si lo ha hecho excelente, no tengas miedo al 9 o 10.
2. EVITA EL "6 POR DEFECTO". Sé específico.
3. Evalúa cada objetivo individualmente. Solo marca "cumplido: true" si hay evidencia clara en el texto.

Responde ÚNICAMENTE con un JSON válido, sin markdown, con esta estructura:
{
  "puntuacion": <número entero 0-10>,
  "objetivos": [
    {
      "id": "<id del objetivo>",
      "descripcion": "<descripcion>",
      "cumplido": <boolean>,
      "comentario": "<breve explicación de por qué sí o por qué no>",
      "ejemplo": "<frase alternativa si no cumplió, vacía si cumplió>"
    }
  ],
  "resumen": "<Valoración profesional de 2-3 frases resaltando puntos fuertes y áreas de mejora>"
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