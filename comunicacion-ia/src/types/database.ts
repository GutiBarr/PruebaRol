export type UserRole = 'user' | 'admin' | 'superadmin';

export interface Profile {
  id: string;
  azure_oid: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Scenario {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  rol_usuario: string;
  rol_ia: string;
  contexto: string;
  frase_inicial: string;
  system_prompt: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ScenarioObjective {
  id: string;
  scenario_id: string;
  slug: string;
  descripcion: string;
  sort_order: number;
}

export interface Session {
  id: string;
  user_id: string;
  scenario_id: string;
  duration_seconds: number;
  puntuacion?: number;
  resumen_feedback?: string;
  feedback_raw?: any;
  started_at: string;
  finished_at?: string;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  sent_at: string;
}

export interface SessionObjectiveResult {
  id: string;
  session_id: string;
  objective_id: string;
  cumplido: boolean;
  comentario?: string;
  ejemplo?: string;
}
