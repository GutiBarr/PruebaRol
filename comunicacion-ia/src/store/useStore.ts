// src/store/useStore.ts
import { create } from "zustand";
import type { Message, Feedback } from "../services/groqService";
import type { Scenario, Profile } from "../types/database";

type View = "selector" | "briefing" | "chat" | "feedback" | "custom-creator" | "admin-dashboard" | "superadmin-users" | "global-history";

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
  view: "selector",
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
    set({
      view: "chat",
      messages: [{ role: "assistant", content: scenario.frase_inicial }],
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
