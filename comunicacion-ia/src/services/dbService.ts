import { supabase } from './supabase';
import type { Profile, Scenario, UserRole } from '../types/database';

export const dbService = {
  // --- Profiles ---
  async upsertProfile(
    azure_oid: string,
    email: string,
    full_name: string,
    avatar_url?: string
  ): Promise<Profile> {
    if (!email.endsWith('@stemdo.io')) {
      throw new Error('Acceso restringido: Solo cuentas de @stemdo.io están permitidas.');
    }
    const { data, error } = await supabase.rpc('upsert_profile', {
      p_azure_oid: azure_oid,
      p_email: email,
      p_full_name: full_name,
      p_avatar_url: avatar_url || null
    });

    if (error) throw new Error(error.message);

    return data as Profile;
  },

  async setAppContext(azure_oid: string): Promise<void> {
    try {
      await supabase.rpc('set_config', {
        name: 'app.azure_oid',
        value: azure_oid
      });
    } catch (e) {
      console.warn("RLS Context error:", e);
    }
  },

  async getMyProfile(azure_oid: string): Promise<Profile | null> {
    await this.setAppContext(azure_oid);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('azure_oid', azure_oid)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data;
  },

  async getAllProfiles(azure_oid: string): Promise<Profile[]> {
    await this.setAppContext(azure_oid);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw error;

    return data || [];
  },

  async changeUserRole(
    userId: string,
    newRole: UserRole,
    admin_azure_oid: string
  ): Promise<void> {
    await this.setAppContext(admin_azure_oid);

    const { error } = await supabase.rpc('change_user_role', {
      target_user_id: userId,
      new_role: newRole
    });

    if (error) throw error;
  },

  // --- Scenarios ---
  async getScenarios(
    azure_oid?: string,
    isAdmin?: boolean
  ): Promise<Scenario[]> {
    if (azure_oid) await this.setAppContext(azure_oid);

    const { data, error } = await supabase
      .from('scenarios')
      .select('*, scenario_objectives(*)')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // 🔥 FIX CLAVE: normalizamos objetivos
    return (data || []).map((s: any) => ({
      ...s,
      objetivos: s.scenario_objectives ?? []
    }));
  },

  async createScenario(
    scenario: Partial<Scenario>,
    objectives: any[],
    azure_oid: string
  ): Promise<string> {
    await this.setAppContext(azure_oid);

    const { data, error } = await supabase.rpc('create_scenario_secure', {
      p_titulo: scenario.titulo,
      p_slug: scenario.slug,
      p_descripcion: scenario.descripcion,
      p_rol_usuario: scenario.rol_usuario,
      p_rol_ia: scenario.rol_ia,
      p_contexto: scenario.contexto,
      p_frase_inicial: scenario.frase_inicial,
      p_system_prompt: scenario.system_prompt,
      p_objectives: objectives,
      p_azure_oid: azure_oid
    });

    if (error) throw error;

    return data;
  },

  async deleteScenario(
    scenarioId: string,
    azure_oid: string
  ): Promise<void> {
    await this.setAppContext(azure_oid);

    const { error } = await supabase.rpc('delete_scenario_secure', {
      p_scenario_id: scenarioId,
      p_azure_oid: azure_oid
    });

    if (error) throw error;
  },

  async updateScenarioStatus(
    scenarioId: string,
    isActive: boolean,
    azure_oid: string
  ): Promise<void> {
    await this.setAppContext(azure_oid);

    const { error } = await supabase
      .from('scenarios')
      .update({ is_active: isActive })
      .eq('id', scenarioId);

    if (error) throw error;
  },

  // --- Sessions ---
  async getAllSessions(azure_oid: string): Promise<any[]> {
    await this.setAppContext(azure_oid);

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        profiles (full_name, avatar_url),
        scenarios (titulo),
        session_messages (id)
      `)
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
      throw error;
    }

    return data || [];
  },
  async saveCompleteSession(params: {
    scenario_id: string;
    duration_seconds: number;
    puntuacion: number;
    resumen: string;
    feedback_raw: any;
    messages: any[];
    objective_results: any[];
    azure_oid: string; // La necesitamos para el contexto
  }): Promise<string> {
    // 1. Establecemos el contexto de seguridad
    await this.setAppContext(params.azure_oid);

    // 2. Llamamos a la función RPC de la base de datos
    const { data, error } = await supabase.rpc('save_complete_session', {
      p_scenario_id: params.scenario_id,
      p_duration_seconds: params.duration_seconds,
      p_puntuacion: params.puntuacion,
      p_resumen: params.resumen,
      p_feedback_raw: params.feedback_raw,
      p_messages: params.messages,
      p_objective_results: params.objective_results,
      p_azure_oid: params.azure_oid
    });

    if (error) {
      console.error("Error en RPC save_complete_session:", error);
      throw error;
    }

    return data; // Retorna el ID de la sesión creada
  },

  async getInProgressSession(scenarioId: string, azure_oid: string): Promise<any | null> {
    await this.setAppContext(azure_oid);

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        session_messages (*)
      `)
      .eq('scenario_id', scenarioId)
      .is('finished_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching in-progress session:", error);
      return null;
    }

    return data;
  },

  async savePartialSession(params: {
    session_id: string | null;
    scenario_id: string;
    messages: any[];
    azure_oid: string;
  }): Promise<string> {
    await this.setAppContext(params.azure_oid);

    const { data, error } = await supabase.rpc('save_partial_session', {
      p_session_id: params.session_id,
      p_scenario_id: params.scenario_id,
      p_messages: params.messages
    });

    if (error) {
      console.error("Error en RPC save_partial_session:", error);
      throw error;
    }

    return data;
  },

  async deleteSession(sessionId: string, azure_oid: string): Promise<void> {
    await this.setAppContext(azure_oid);
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  },

  async finishSession(sessionId: string, azure_oid: string, scenarioId: string): Promise<void> {
    await this.setAppContext(azure_oid);
    const { error } = await supabase.rpc('finish_session', {
      p_session_id: sessionId,
      p_azure_oid: azure_oid,
      p_scenario_id: scenarioId
    });

    if (error) throw error;
  },

  async cleanupPendingSessions(scenarioId: string, azure_oid: string): Promise<void> {
    await this.setAppContext(azure_oid);
    // Usamos el RPC para que la limpieza sea atómica y se salte RLS si es necesario
    const { error } = await supabase.rpc('cleanup_pending_sessions', {
      p_scenario_id: scenarioId,
      p_azure_oid: azure_oid
    });

    if (error) {
      console.error("Error cleaning up pending sessions via RPC:", error);
    }
  },
};

