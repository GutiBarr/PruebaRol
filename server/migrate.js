// Migración de datos: Supabase → PostgreSQL local
// Ejecutar una sola vez: node migrate.js
// Requiere en .env: SUPABASE_URL y SUPABASE_SERVICE_KEY

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const local = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'stemdo',
});

async function run() {
  console.log('🚀 Iniciando migración Supabase → PostgreSQL local...\n');

  // ── 1. PROFILES ────────────────────────────────────────────────────────────
  console.log('📋 Migrando profiles...');
  const { data: profiles, error: e1 } = await supabase.from('profiles').select('*');
  if (e1) throw new Error('profiles: ' + e1.message);

  for (const p of profiles) {
    await local.query(`
      INSERT INTO public.profiles (id, azure_oid, email, full_name, avatar_url, role, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (azure_oid) DO UPDATE SET
        email      = EXCLUDED.email,
        full_name  = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        role       = EXCLUDED.role,
        updated_at = EXCLUDED.updated_at
    `, [p.id, p.azure_oid, p.email, p.full_name, p.avatar_url, p.role, p.created_at, p.updated_at]);
  }
  console.log(`   ✅ ${profiles.length} profiles migrados`);

  // ── 2. SCENARIOS ───────────────────────────────────────────────────────────
  console.log('🎭 Migrando scenarios...');
  const { data: scenarios, error: e2 } = await supabase.from('scenarios').select('*');
  if (e2) throw new Error('scenarios: ' + e2.message);

  for (const s of scenarios) {
    await local.query(`
      INSERT INTO public.scenarios
        (id, slug, titulo, descripcion, rol_usuario, rol_ia, contexto, frase_inicial,
         system_prompt, is_active, created_by, created_at, updated_at, nivel, competencia)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      ON CONFLICT (id) DO UPDATE SET
        slug          = EXCLUDED.slug,
        titulo        = EXCLUDED.titulo,
        descripcion   = EXCLUDED.descripcion,
        rol_usuario   = EXCLUDED.rol_usuario,
        rol_ia        = EXCLUDED.rol_ia,
        contexto      = EXCLUDED.contexto,
        frase_inicial = EXCLUDED.frase_inicial,
        system_prompt = EXCLUDED.system_prompt,
        is_active     = EXCLUDED.is_active,
        nivel         = EXCLUDED.nivel,
        competencia   = EXCLUDED.competencia,
        updated_at    = EXCLUDED.updated_at
    `, [
      s.id, s.slug, s.titulo, s.descripcion, s.rol_usuario, s.rol_ia,
      s.contexto, s.frase_inicial, s.system_prompt, s.is_active, s.created_by,
      s.created_at, s.updated_at, s.nivel || 'Trainee', s.competencia || 'Problem Solving'
    ]);
  }
  console.log(`   ✅ ${scenarios.length} scenarios migrados`);

  // ── 3. SCENARIO_OBJECTIVES ─────────────────────────────────────────────────
  console.log('🎯 Migrando scenario_objectives...');
  const { data: objectives, error: e3 } = await supabase.from('scenario_objectives').select('*');
  if (e3) throw new Error('scenario_objectives: ' + e3.message);

  for (const o of objectives) {
    await local.query(`
      INSERT INTO public.scenario_objectives (id, scenario_id, slug, descripcion, sort_order)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (id) DO UPDATE SET
        descripcion = EXCLUDED.descripcion,
        sort_order  = EXCLUDED.sort_order
    `, [o.id, o.scenario_id, o.slug, o.descripcion, o.sort_order ?? 0]);
  }
  console.log(`   ✅ ${objectives.length} objectives migrados`);

  // ── 4. SESSIONS ────────────────────────────────────────────────────────────
  console.log('💬 Migrando sessions...');
  const { data: sessions, error: e4 } = await supabase.from('sessions').select('*');
  if (e4) throw new Error('sessions: ' + e4.message);

  for (const s of sessions) {
    await local.query(`
      INSERT INTO public.sessions
        (id, user_id, scenario_id, duration_seconds, puntuacion,
         resumen_feedback, feedback_raw, started_at, finished_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (id) DO NOTHING
    `, [
      s.id, s.user_id, s.scenario_id, s.duration_seconds ?? 0,
      s.puntuacion, s.resumen_feedback,
      s.feedback_raw ? JSON.stringify(s.feedback_raw) : null,
      s.started_at, s.finished_at
    ]);
  }
  console.log(`   ✅ ${sessions.length} sessions migradas`);

  // ── 5. SESSION_MESSAGES ────────────────────────────────────────────────────
  console.log('💭 Migrando session_messages...');
  const { data: messages, error: e5 } = await supabase.from('session_messages').select('*');
  if (e5) throw new Error('session_messages: ' + e5.message);

  for (const m of messages) {
    await local.query(`
      INSERT INTO public.session_messages (id, session_id, role, content, sent_at)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (id) DO NOTHING
    `, [m.id, m.session_id, m.role, m.content, m.sent_at]);
  }
  console.log(`   ✅ ${messages.length} mensajes migrados`);

  // ── 6. SESSION_OBJECTIVE_RESULTS ───────────────────────────────────────────
  console.log('📊 Migrando session_objective_results...');
  const { data: results, error: e6 } = await supabase.from('session_objective_results').select('*');
  if (e6) throw new Error('session_objective_results: ' + e6.message);

  for (const r of results) {
    await local.query(`
      INSERT INTO public.session_objective_results
        (id, session_id, objective_id, cumplido, comentario, ejemplo)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (id) DO NOTHING
    `, [r.id, r.session_id, r.objective_id, r.cumplido, r.comentario, r.ejemplo]);
  }
  console.log(`   ✅ ${results.length} resultados de objetivos migrados`);

  // ── RESUMEN ────────────────────────────────────────────────────────────────
  console.log('\n🎉 Migración completada:');
  console.log(`   👤 ${profiles.length} usuarios`);
  console.log(`   🎭 ${scenarios.length} escenarios`);
  console.log(`   🎯 ${objectives.length} objetivos`);
  console.log(`   💬 ${sessions.length} sesiones`);
  console.log(`   💭 ${messages.length} mensajes`);
  console.log(`   📊 ${results.length} resultados de objetivos`);

  await local.end();
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Error en la migración:', err.message);
  process.exit(1);
});
