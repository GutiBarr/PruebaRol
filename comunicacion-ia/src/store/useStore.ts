// src/store/useStore.ts
import { create } from "zustand";
import type { Message, Feedback } from "../services/groqService";
import type { Scenario, Profile } from "../types/database";

export type View = "selector" | "briefing" | "chat" | "feedback" | "custom-creator" | "admin-dashboard" | "superadmin-users" | "global-history" | "my-history";

const getInitialView = (): View => {
  if (typeof window === "undefined") return "selector";
  const hash = window.location.hash.replace("#", "") as View;
  
  // Vistas que se pueden restaurar sin estado efímero
  const validViews: View[] = ["selector", "admin-dashboard", "superadmin-users", "global-history", "my-history"];
  
  if (validViews.includes(hash)) {
    return hash;
  }
  
  // Si es chat, briefing o feedback, requerimos escenario en memoria que se pierde al refrescar,
  // así que por seguridad devolvemos al selector.
  return "selector";
};

interface AppState {
  userProfile: Profile | null;
  view: View;
  scenario: Scenario | null;
  messages: Message[];
  feedback: Feedback | null;
  loading: boolean;
  voiceMode: boolean;
  selectedVoiceURI: string | null;

  setUserProfile: (profile: Profile | null) => void;
  setView: (view: View) => void;
  selectScenario: (scenario: Scenario) => void;
  startChat: () => void;
  addMessage: (message: Message) => void;
  setFeedback: (feedback: Feedback) => void;
  setLoading: (loading: boolean) => void;
  setCustomScenario: (scenario: Scenario) => void;
  toggleVoiceMode: () => void;
  setSelectedVoiceURI: (uri: string | null) => void;
  setSessionSeconds: (s: number) => void;
  sessionSeconds: number;
  reset: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  userProfile: null,
  view: getInitialView(),
  scenario: null,
  messages: [],
  feedback: null,
  loading: false,
  voiceMode: false,
  selectedVoiceURI: null,

  setUserProfile: (userProfile) => set({ userProfile }),
  setCustomScenario: (scenario) =>
    set({ scenario, view: "briefing", messages: [], feedback: null }),
  setView: (view) => set({ view }),
  selectScenario: (scenario) =>
    set({ scenario, view: "briefing", messages: [], feedback: null }),
  startChat: () => {
    const { scenario } = get();
    if (!scenario) return;
    
    const initialMessages = scenario.frase_inicial && scenario.frase_inicial.trim() !== "" 
      ? [{ role: "assistant" as const, content: scenario.frase_inicial }]
      : [];
      
    set({
      view: "chat",
      messages: initialMessages,
    });
  },
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setFeedback: (feedback) => set({ feedback, view: "feedback" }),
  setLoading: (loading) => set({ loading }),
  toggleVoiceMode: () => set((s) => ({ voiceMode: !s.voiceMode })),
  setSelectedVoiceURI: (selectedVoiceURI) => set({ selectedVoiceURI }),
  sessionSeconds: 0,
  setSessionSeconds: (sessionSeconds) => set({ sessionSeconds }),
  reset: () =>
    set({ view: "selector", scenario: null, messages: [], feedback: null, sessionSeconds: 0 }),
}));

// Sincronizar estado global con el hash de la URL
if (typeof window !== "undefined") {
  // Cuando cambia el estado de Zustand, actualizamos la URL
  useStore.subscribe((state) => {
    if (window.location.hash.replace("#", "") !== state.view) {
      window.location.hash = state.view;
    }
  });

  // Cuando el usuario usa los botones de Atrás/Adelante del navegador
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.replace("#", "") as View;
    const currentView = useStore.getState().view;
    
    // Solo actualizamos si es diferente y es una vista válida
    if (hash && hash !== currentView) {
      const allViews: View[] = ["selector", "briefing", "chat", "feedback", "custom-creator", "admin-dashboard", "superadmin-users", "global-history", "my-history"];
      if (allViews.includes(hash)) {
        useStore.getState().setView(hash);
      }
    }
  });
}
