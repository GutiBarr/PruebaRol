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
  }
};