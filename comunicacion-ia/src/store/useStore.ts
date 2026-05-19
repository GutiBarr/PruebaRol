// src/store/useStore.ts
import { create } from "zustand";
import type { Message, Feedback } from "../services/groqService";
import type { Scenario, Profile } from "../types/database";


export type View = "selector" | "briefing" | "chat" | "feedback" | "custom-creator" | "admin-dashboard" | "superadmin-users" | "global-history" | "history";


const getInitialView = (): View => {
  if (typeof window === "undefined") return "selector";
  const hash = window.location.hash.replace("#", "") as View;

  const validViews: View[] = ["selector", "admin-dashboard", "superadmin-users", "global-history", "history"];

  if (validViews.includes(hash)) {
    return hash;
  }

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
  currentSessionId: string | null;
  setSessionId: (id: string | null) => void;
  editingScenario: Scenario | null;
  setEditingScenario: (scenario: Scenario | null) => void;
  scenarios: Scenario[];
  setScenarios: (scenarios: Scenario[]) => void;
  globalSessions: any[];
  setGlobalSessions: (sessions: any[]) => void;
  allUsers: Profile[];
  setAllUsers: (users: Profile[]) => void;
  mySessions: any[];
  setMySessions: (sessions: any[]) => void;
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
  currentSessionId: null,
  editingScenario: null,
  scenarios: [],
  globalSessions: [],
  allUsers: [],
  mySessions: [],

  setUserProfile: (userProfile) => set({ userProfile }),
  setCustomScenario: (scenario) =>
    set({ scenario, view: "briefing", messages: [], feedback: null, currentSessionId: null }),
  setView: (view) => set({ view }),
  selectScenario: (scenario) =>
    set({ scenario, view: "briefing", messages: [], feedback: null, currentSessionId: null, editingScenario: null }),
  setSessionId: (currentSessionId) => set({ currentSessionId }),
  setEditingScenario: (editingScenario) => set({ editingScenario }),
  setScenarios: (scenarios) => set({ scenarios }),
  setGlobalSessions: (globalSessions) => set({ globalSessions }),
  setAllUsers: (allUsers) => set({ allUsers }),
  setMySessions: (mySessions) => set({ mySessions }),
  startChat: () => {
    const { scenario } = get();
    if (!scenario) return;

    const initialMessages = scenario.frase_inicial && scenario.frase_inicial.trim() !== ""
      ? [{ role: "assistant" as const, content: scenario.frase_inicial }]
      : [];

    set({
      view: "chat",
      messages: initialMessages,
      currentSessionId: null,
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
    set({ view: "selector", scenario: null, messages: [], feedback: null, sessionSeconds: 0, currentSessionId: null, editingScenario: null }),
}));

// Sincronizar estado global con el hash de la URL
if (typeof window !== "undefined") {
  useStore.subscribe((state) => {
    if (window.location.hash.replace("#", "") !== state.view) {
      window.location.hash = state.view;
    }
  });

  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.replace("#", "") as View;
    const currentView = useStore.getState().view;

    if (hash && hash !== currentView) {
      const allViews: View[] = ["selector", "briefing", "chat", "feedback", "custom-creator", "admin-dashboard", "superadmin-users", "global-history", "history"];

      if (allViews.includes(hash)) {
        useStore.getState().setView(hash);
      }
    }
  });
}
