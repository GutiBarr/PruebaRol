import type { Profile, Scenario, UserRole } from '../types/database';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiFetch(path: string, options?: RequestInit): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const dbService = {

  // ─── PROFILES ───────────────────────────────────────────────────────────────

  async upsertProfile(
    azure_oid: string,
    email: string,
    full_name: string,
    avatar_url?: string
  ): Promise<Profile> {
    if (!email.endsWith('@stemdo.io')) {
      throw new Error('Acceso restringido: Solo cuentas de @stemdo.io están permitidas.');
    }
    return apiFetch('/api/profiles/upsert', {
      method: 'POST',
      body: JSON.stringify({ azure_oid, email, full_name, avatar_url }),
    });
  },

  // No-op: ya no es necesario con el backend propio
  async setAppContext(_azure_oid: string): Promise<void> {},

  async getMyProfile(azure_oid: string): Promise<Profile | null> {
    return apiFetch(`/api/profiles/me?azure_oid=${encodeURIComponent(azure_oid)}`);
  },

  async getAllProfiles(azure_oid: string): Promise<Profile[]> {
    return apiFetch(`/api/profiles?azure_oid=${encodeURIComponent(azure_oid)}`);
  },

  async changeUserRole(
    userId: string,
    newRole: UserRole,
    admin_azure_oid: string
  ): Promise<void> {
    await apiFetch(`/api/profiles/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ new_role: newRole, azure_oid: admin_azure_oid }),
    });
  },

  // ─── SCENARIOS ───────────────────────────────────────────────────────────────

  async getScenarios(
    _azure_oid?: string,
    _isAdmin?: boolean
  ): Promise<Scenario[]> {
    const data = await apiFetch('/api/scenarios');
    return data.map((s: any) => ({
      ...s,
      objetivos: s.scenario_objectives ?? [],
    }));
  },

  async createScenario(
    scenario: Partial<Scenario>,
    objectives: any[],
    azure_oid: string
  ): Promise<string> {
    return apiFetch('/api/scenarios', {
      method: 'POST',
      body: JSON.stringify({ scenario, objectives, azure_oid }),
    });
  },

  async deleteScenario(scenarioId: string, azure_oid: string): Promise<void> {
    await apiFetch(`/api/scenarios/${scenarioId}`, {
      method: 'DELETE',
      body: JSON.stringify({ azure_oid }),
    });
  },

  async updateScenario(
    scenarioId: string,
    scenario: Partial<Scenario>,
    objectives: any[],
    azure_oid: string
  ): Promise<void> {
    await apiFetch(`/api/scenarios/${scenarioId}`, {
      method: 'PUT',
      body: JSON.stringify({ scenario, objectives, azure_oid }),
    });
  },

  async updateScenarioStatus(
    scenarioId: string,
    isActive: boolean,
    _azure_oid: string
  ): Promise<void> {
    await apiFetch(`/api/scenarios/${scenarioId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  // ─── SESSIONS ────────────────────────────────────────────────────────────────

  async getAllSessions(azure_oid: string): Promise<any[]> {
    return apiFetch(`/api/sessions/all?azure_oid=${encodeURIComponent(azure_oid)}`);
  },

  // Mantenido por compatibilidad; el backend ya devuelve datos completos en getAllSessions
  async getMySessionsWithDetails(azure_oid: string): Promise<any[]> {
    return apiFetch(`/api/sessions/all?azure_oid=${encodeURIComponent(azure_oid)}`);
  },

  async saveCompleteSession(params: {
    scenario_id: string;
    duration_seconds: number;
    puntuacion: number;
    resumen: string;
    feedback_raw: any;
    messages: any[];
    objective_results: any[];
    azure_oid: string;
  }): Promise<string> {
    return apiFetch('/api/sessions/complete', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async savePartialSession(params: {
    session_id: string | null;
    scenario_id: string;
    messages: any[];
    azure_oid: string;
  }): Promise<string> {
    return apiFetch('/api/sessions/partial', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getInProgressSession(
    scenarioId: string,
    azure_oid: string,
    profileId: string
  ): Promise<any | null> {
    return apiFetch(
      `/api/sessions/in-progress?scenario_id=${scenarioId}&azure_oid=${encodeURIComponent(azure_oid)}&profile_id=${profileId}`
    );
  },

  async getLastCompletedSession(
    scenarioId: string,
    _azure_oid: string,
    profileId: string
  ): Promise<any | null> {
    return apiFetch(
      `/api/sessions/last-completed?scenario_id=${scenarioId}&profile_id=${profileId}`
    );
  },

  async deleteSession(sessionId: string, _azure_oid: string): Promise<void> {
    await apiFetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
  },

  async finishSession(
    sessionId: string,
    azure_oid: string,
    scenarioId: string
  ): Promise<void> {
    await apiFetch('/api/sessions/finish', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, azure_oid, scenario_id: scenarioId }),
    });
  },

  async cleanupPendingSessions(
    scenarioId: string,
    azure_oid: string
  ): Promise<void> {
    await apiFetch('/api/sessions/cleanup', {
      method: 'POST',
      body: JSON.stringify({ scenario_id: scenarioId, azure_oid }),
    });
  },
};
