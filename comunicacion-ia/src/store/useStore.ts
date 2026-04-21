// src/store/useStore.ts
import { create } from "zustand";
import type { Message, Feedback } from "../services/aiService";
import type { Scenario } from "../data/scenarios";

type View = "selector" | "briefing" | "chat" | "feedback";

interface AppState {
  view: View;
  scenario: Scenario | null;
  messages: Message[];
  feedback: Feedback | null;
  loading: boolean;

  setView: (view: View) => void;
  selectScenario: (scenario: Scenario) => void;
  startChat: () => void;
  addMessage: (message: Message) => void;
  setFeedback: (feedback: Feedback) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  view: "selector",
  scenario: null,
  messages: [],
  feedback: null,
  loading: false,

  setView: (view) => set({ view }),
  selectScenario: (scenario) =>
    set({ scenario, view: "briefing", messages: [], feedback: null }),
  startChat: () => {
    const { scenario } = get();
    if (!scenario) return;
    // La IA arranca con su frase inicial
    set({
      view: "chat",
      messages: [{ role: "assistant", content: scenario.frasenicial }],
    });
  },
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setFeedback: (feedback) => set({ feedback, view: "feedback" }),
  setLoading: (loading) => set({ loading }),
  reset: () =>
    set({ view: "selector", scenario: null, messages: [], feedback: null }),
}));