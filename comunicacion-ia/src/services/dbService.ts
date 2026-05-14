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
      .order('started_at', { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
      throw error;
    }

    return data || [];
  },


  async getMySessionsWithDetails(azure_oid: string): Promise<any[]> {
  await this.setAppContext(azure_oid);

  // Primero obtenemos el profile_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('azure_oid', azure_oid)
    .single();

  if (profileError || !profile) return [];

  // Luego buscamos las sesiones por user_id
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      scenarios (titulo, descripcion),
      session_messages (id, role, content, created_at),
      session_objective_results (
        cumplido,
        comentario,
        ejemplo,
        scenario_objectives (descripcion)
      )
    `)
    .eq('user_id', profile.id)
    .order('started_at', { ascending: false });

  if (error) {
    console.error("Error fetching my sessions:", error);
    throw error;
  }

  return data || [];
},

  async saveCompleteSession(data: {
  scenario_id: string;
  duration_seconds: number;
  puntuacion: number;
  resumen: string;
  feedback_raw: any;
  messages: { role: string; content: string }[];
  objective_results: { objective_id: string; cumplido: boolean; comentario: string; ejemplo: string }[];
  azure_oid: string;
}): Promise<void> {
  await this.setAppContext(data.azure_oid);

  // 1. Obtener el profile_id a partir del azure_oid
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('azure_oid', data.azure_oid)
    .single();

  if (profileError || !profile) throw new Error('Perfil no encontrado');

  // 2. Buscar el scenario en Supabase por id o slug
  const { data: scenarioRow } = await supabase
    .from('scenarios')
    .select('id')
    .eq('id', data.scenario_id)
    .maybeSingle();

  // 3. Insertar la sesión
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      user_id: profile.id,
      scenario_id: scenarioRow?.id ?? null,
      duration_seconds: data.duration_seconds,
      puntuacion: data.puntuacion,
      resumen_feedback: data.resumen,
      feedback_raw: data.feedback_raw,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (sessionError || !session) throw new Error('Error al guardar la sesión');

  // 4. Insertar mensajes
  if (data.messages.length > 0) {
    await supabase.from('session_messages').insert(
      data.messages.map(m => ({
        session_id: session.id,
        role: m.role,
        content: m.content,
      }))
    );
  }

  // 5. Insertar resultados de objetivos
  if (data.objective_results.length > 0) {
    await supabase.from('session_objective_results').insert(
      data.objective_results.map(o => ({
        session_id: session.id,
        objective_id: null,
        cumplido: o.cumplido,
        comentario: o.comentario,
        ejemplo: o.ejemplo,
      }))
    );
  }
},

};