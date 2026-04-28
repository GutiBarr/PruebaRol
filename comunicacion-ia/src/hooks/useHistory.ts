import type { Feedback } from "../services/groqService";

export interface SessionRecord {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  date: string;           // ISO string
  durationSeconds: number;
  feedback: Feedback;
}

const KEY = "roleplay_history";

export function useHistory() {
  function getAll(): SessionRecord[] {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      return [];
    }
  }

  function save(record: Omit<SessionRecord, "id">) {
    const all = getAll();
    const newRecord: SessionRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    // Máximo 20 sesiones guardadas
    const updated = [newRecord, ...all].slice(0, 20);
    localStorage.setItem(KEY, JSON.stringify(updated));
    return newRecord;
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  return { getAll, save, clear };
}