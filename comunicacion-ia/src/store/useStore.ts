import { create } from "zustand";
import type { Message, Feedback } from "../services/groqService";
import type { Scenario } from "../data/scenarios";

type View = "selector" | "briefing" | "chat" | "feedback" | "custom-creator";

interface AppState {
  view: View;
  scenario: Scenario | null;
  messages: Message[];
  feedback: Feedback | null;
  loading: boolean;
  voiceMode: boolean;
  selectedVoiceURI: string | null;

  setView: (view: View) => void;
  selectScenario: (scenario: Scenario) => void;
  setCustomScenario: (scenario: Scenario) => void;
  startChat: () => void;
  addMessage: (message: Message) => void;
  setFeedback: (feedback: Feedback) => void;
  setLoading: (loading: boolean) => void;
  toggleVoiceMode: () => void;
  setSelectedVoiceURI: (uri: string | null) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  view: "selector",
  scenario: null,
  messages: [],
  feedback: null,
  loading: false,
  voiceMode: false,
  selectedVoiceURI: null,

  setView: (view) => set({ view }),
  selectScenario: (scenario) =>
    set({ scenario, view: "briefing", messages: [], feedback: null }),
  // Para escenarios personalizados: salta el briefing y va directo al chat con la frase inicial
  setCustomScenario: (scenario) =>
    set({
      scenario,
      view: "chat",
      messages: [{ role: "assistant", content: scenario.frasenicial }],
      feedback: null,
    }),
  startChat: () => {
    const { scenario } = get();
    if (!scenario) return;
    set({
      view: "chat",
      messages: [{ role: "assistant", content: scenario.frasenicial }],
    });
  },
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setFeedback: (feedback) => set({ feedback, view: "feedback" }),
  setLoading: (loading) => set({ loading }),
  toggleVoiceMode: () => set((s) => ({ voiceMode: !s.voiceMode })),
  setSelectedVoiceURI: (uri) => set({ selectedVoiceURI: uri }),
  reset: () =>
    set({ view: "selector", scenario: null, messages: [], feedback: null }),
}));