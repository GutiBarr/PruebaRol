import { supabase } from './supabase';
import type { Profile, Scenario, Session, UserRole } from '../types/database';

export const dbService = {
  // --- Profiles ---
  async upsertProfile(azure_oid: string, email: string, full_name: string, avatar_url?: string): Promise<Profile> {
    console.log("Intentando upsertProfile para:", email);
    const { data, error } = await supabase.rpc('upsert_profile', {
      p_azure_oid: azure_oid,
      p_email: email,
      p_full_name: full_name,
      p_avatar_url: avatar_url || null
    });

    if (error) {
      console.error("Error detallado de Supabase RPC (upsert_profile):", error);
      throw new Error(`Error en base de datos: ${error.message} (Código: ${error.code}). Asegúrate de haber ejecutado el script SQL en Supabase.`);
    }
    return data as Profile;
  },


  async setAppContext(azure_oid: string): Promise<void> {
    try {
      await supabase.rpc('set_config', { name: 'app.azure_oid', value: azure_oid });
    } catch (e) {
      console.warn("RLS Context could not be set:", e);
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
    const maxAttempts = 5;
    let bestData: Profile[] = [];
    
    for (let i = 0; i < maxAttempts; i++) {
      try { await this.setAppContext(azure_oid); } catch (e) { }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });
        
      if (error) continue;
      
      if (data && data.length > bestData.length) {
        bestData = data;
      }
      
      if (data && data.length > 0) return data;
      
      await new Promise(r => setTimeout(r, 100));
    }
    return bestData;
  },

  async changeUserRole(userId: string, newRole: UserRole, admin_azure_oid: string): Promise<void> {
    let success = false;
    for (let i = 0; i < 20; i++) {
      try { await this.setAppContext(admin_azure_oid); } catch (e) { }
      const { error } = await supabase.rpc('change_user_role', {
        target_user_id: userId,
        new_role: newRole
      });
      if (!error) { success = true; break; }
      await new Promise(r => setTimeout(r, 100));
    }
    if (!success) throw new Error("Error al cambiar rol debido al pool de conexiones");
  },

  // --- Scenarios ---
  async getScenarios(azure_oid?: string, isAdmin?: boolean): Promise<Scenario[]> {
    if (!azure_oid || !isAdmin) {
      if (azure_oid) { try { await this.setAppContext(azure_oid); } catch (e) { } }
      const { data, error } = await supabase
        .from('scenarios')
        .select('*, scenario_objectives(*)')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    }

    const maxAttempts = 5;
    let bestData: Scenario[] = [];
    
    for (let i = 0; i < maxAttempts; i++) {
      try { await this.setAppContext(azure_oid); } catch (e) { }
      
      const { data, error } = await supabase
        .from('scenarios')
        .select('*, scenario_objectives(*)')
        .order('created_at', { ascending: true });
        
      if (error) continue;
      
      if (data && data.length > bestData.length) bestData = data;
      if (data && data.some(s => !s.is_active)) return data; 
      
      await new Promise(r => setTimeout(r, 100));
    }
    
    return bestData;
  },

  async createScenario(scenario: Partial<Scenario>, objectives: any[], azure_oid: string): Promise<string> {
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

  async deleteScenario(scenarioId: string, azure_oid: string): Promise<void> {
    const { error } = await supabase.rpc('delete_scenario_secure', {
      p_scenario_id: scenarioId,
      p_azure_oid: azure_oid
    });
    if (error) throw error;
  },

  async updateScenarioStatus(scenarioId: string, isActive: boolean, azure_oid: string): Promise<void> {
    let success = false;
    for (let i = 0; i < 30; i++) {
      try { await this.setAppContext(azure_oid); } catch (e) { }
      
      const { data, error } = await supabase
        .from('scenarios')
        .update({ is_active: isActive })
        .eq('id', scenarioId)
        .select('id');
        
      if (error) throw error;
      if (data && data.length > 0) { success = true; break; }
      
      await new Promise(r => setTimeout(r, 200));
    }
    
    if (!success) {
      throw new Error("Error de red: La base de datos no pudo procesar la solicitud por culpa del pool de conexiones. Inténtalo de nuevo.");
    }
  },

  // --- Sessions ---
  async saveCompleteSession(params: {
    scenario_id: string;
    duration_seconds: number;
    puntuacion: number;
    resumen: string;
    feedback_raw: any;
    messages: { role: string; content: string }[];
    objective_results: { objective_id: string; cumplido: boolean; comentario?: string; ejemplo?: string }[];
    azure_oid: string; 
  }): Promise<string> {
    await this.setAppContext(params.azure_oid);

    const { data, error } = await supabase.rpc('save_complete_session', {
      p_scenario_id: params.scenario_id,
      p_duration_seconds: params.duration_seconds,
      p_puntuacion: params.puntuacion,
      p_resumen: params.resumen,
      p_feedback_raw: params.feedback_raw,
      p_messages: params.messages,
      p_objective_results: params.objective_results
    });

    if (error) throw error;
    return data;
  },

  async getMySessions(azure_oid: string): Promise<any[]> {
    const maxAttempts = 5;
    let bestData: any[] = [];
    
    for (let i = 0; i < maxAttempts; i++) {
      try { await this.setAppContext(azure_oid); } catch (e) { }
      const { data, error } = await supabase
        .from('sessions')
        .select('*, scenarios(titulo), session_messages(*)')
        .order('started_at', { ascending: false });
        
      if (error) continue;
      
      if (data && data.length > bestData.length) bestData = data;
      if (data && data.length > 0) return data;
      
      await new Promise(r => setTimeout(r, 100));
    }
    return bestData;
  },

  async getAllSessions(azure_oid: string): Promise<any[]> {
    const maxAttempts = 5;
    let bestData: any[] = [];
    
    for (let i = 0; i < maxAttempts; i++) {
      try { await this.setAppContext(azure_oid); } catch (e) { }
      const { data, error } = await supabase
        .from('sessions')
        .select('*, scenarios(titulo), profiles(full_name), session_messages(*)')
        .order('started_at', { ascending: false });
        
      if (error) continue;
      
      if (data && data.length > bestData.length) bestData = data;
      if (data && data.length > 0) return data;
      
      await new Promise(r => setTimeout(r, 100));
    }
    return bestData;
  }
};
