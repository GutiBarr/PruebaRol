require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'postgres',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
});

pool.connect()
  .then(c => { console.log('✅ Conectado a PostgreSQL'); c.release(); })
  .catch(e => console.error('❌ Error de conexión a PostgreSQL:', e.message));

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '10mb' }));

const q = (text, params) => pool.query(text, params);

// ─── PROFILES ───────────────────────────────────────────────────────────────

app.post('/api/profiles/upsert', async (req, res) => {
  const { azure_oid, email, full_name, avatar_url } = req.body;
  try {
    const result = await q(`
      INSERT INTO public.profiles (azure_oid, email, full_name, avatar_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (azure_oid) DO UPDATE SET
        email       = EXCLUDED.email,
        full_name   = EXCLUDED.full_name,
        avatar_url  = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at  = now()
      RETURNING *
    `, [azure_oid, email, full_name, avatar_url || null]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('upsert_profile:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profiles/me', async (req, res) => {
  const { azure_oid } = req.query;
  try {
    const result = await q('SELECT * FROM public.profiles WHERE azure_oid = $1', [azure_oid]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profiles', async (req, res) => {
  const { azure_oid } = req.query;
  try {
    const auth = await q("SELECT role FROM public.profiles WHERE azure_oid = $1", [azure_oid]);
    if (!['admin', 'superadmin'].includes(auth.rows[0]?.role)) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    const result = await q('SELECT * FROM public.profiles ORDER BY full_name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profiles/:id/role', async (req, res) => {
  const { id } = req.params;
  const { new_role, azure_oid } = req.body;
  try {
    const auth = await q("SELECT role FROM public.profiles WHERE azure_oid = $1", [azure_oid]);
    if (auth.rows[0]?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo superadmin puede cambiar roles' });
    }
    await q("UPDATE public.profiles SET role = $1, updated_at = now() WHERE id = $2", [new_role, id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SCENARIOS ───────────────────────────────────────────────────────────────

app.get('/api/scenarios', async (req, res) => {
  try {
    const result = await q(`
      SELECT s.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',         so.id,
              'scenario_id',so.scenario_id,
              'slug',       so.slug,
              'descripcion',so.descripcion,
              'sort_order', so.sort_order
            ) ORDER BY so.sort_order, so.id
          ) FILTER (WHERE so.id IS NOT NULL),
          '[]'
        ) AS scenario_objectives
      FROM public.scenarios s
      LEFT JOIN public.scenario_objectives so ON so.scenario_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('get_scenarios:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scenarios', async (req, res) => {
  const { scenario, objectives, azure_oid } = req.body;
  const client = await pool.connect();
  try {
    const auth = await client.query(
      "SELECT role FROM public.profiles WHERE azure_oid = $1", [azure_oid]
    );
    if (!['admin', 'superadmin'].includes(auth.rows[0]?.role)) {
      return res.status(403).json({ error: 'No tienes permisos de administrador' });
    }
    await client.query('BEGIN');
    const scen = await client.query(`
      INSERT INTO public.scenarios
        (titulo, slug, descripcion, rol_usuario, rol_ia, contexto, frase_inicial, system_prompt, nivel, competencia)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id
    `, [
      scenario.titulo, scenario.slug, scenario.descripcion,
      scenario.rol_usuario, scenario.rol_ia, scenario.contexto,
      scenario.frase_inicial, scenario.system_prompt,
      scenario.nivel || 'Trainee', scenario.competencia || 'Problem Solving'
    ]);
    const scenarioId = scen.rows[0].id;
    for (const obj of (objectives || [])) {
      await client.query(
        'INSERT INTO public.scenario_objectives (scenario_id, slug, descripcion) VALUES ($1,$2,$3)',
        [scenarioId, obj.slug, obj.descripcion]
      );
    }
    await client.query('COMMIT');
    res.json(scenarioId);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('create_scenario:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/scenarios/:id', async (req, res) => {
  const { id } = req.params;
  const { azure_oid } = req.body;
  try {
    const auth = await q("SELECT role FROM public.profiles WHERE azure_oid = $1", [azure_oid]);
    if (!['admin', 'superadmin'].includes(auth.rows[0]?.role)) {
      return res.status(403).json({ error: 'No tienes permisos para borrar escenarios' });
    }
    await q('DELETE FROM public.scenarios WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/scenarios/:id', async (req, res) => {
  const { id } = req.params;
  const { scenario, objectives, azure_oid } = req.body;
  const client = await pool.connect();
  try {
    const auth = await client.query(
      "SELECT role FROM public.profiles WHERE azure_oid = $1", [azure_oid]
    );
    if (!['admin', 'superadmin'].includes(auth.rows[0]?.role)) {
      return res.status(403).json({ error: 'No tienes permisos para editar escenarios' });
    }
    await client.query('BEGIN');
    await client.query(`
      UPDATE public.scenarios SET
        titulo        = $1,
        slug          = $2,
        descripcion   = $3,
        rol_usuario   = $4,
        rol_ia        = $5,
        contexto      = $6,
        frase_inicial = $7,
        system_prompt = $8,
        nivel         = COALESCE($9, nivel),
        competencia   = COALESCE($10, competencia),
        updated_at    = now()
      WHERE id = $11
    `, [
      scenario.titulo, scenario.slug, scenario.descripcion,
      scenario.rol_usuario, scenario.rol_ia, scenario.contexto,
      scenario.frase_inicial, scenario.system_prompt,
      scenario.nivel || null, scenario.competencia || null, id
    ]);
    await client.query('DELETE FROM public.scenario_objectives WHERE scenario_id = $1', [id]);
    for (const obj of (objectives || [])) {
      await client.query(
        'INSERT INTO public.scenario_objectives (scenario_id, slug, descripcion) VALUES ($1,$2,$3)',
        [id, obj.slug, obj.descripcion]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('update_scenario:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.patch('/api/scenarios/:id/status', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    await q('UPDATE public.scenarios SET is_active = $1, updated_at = now() WHERE id = $2', [is_active, id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SESSIONS ────────────────────────────────────────────────────────────────

// Devuelve todas las sesiones terminadas con datos completos.
// Para admins: todas. Para usuarios normales: solo las suyas.
app.get('/api/sessions/all', async (req, res) => {
  const { azure_oid } = req.query;
  try {
    const auth = await q("SELECT id, role FROM public.profiles WHERE azure_oid = $1", [azure_oid]);
    const profile = auth.rows[0];
    if (!profile) return res.status(403).json({ error: 'Usuario no encontrado' });

    const isAdmin = ['admin', 'superadmin'].includes(profile.role);

    // Para usuarios normales, filtramos por su user_id
    const userFilter = isAdmin ? '' : 'AND p.id = $1';
    const params = isAdmin ? [] : [profile.id];

    const result = await pool.query(`
      SELECT
        s.id,
        s.user_id,
        s.scenario_id,
        s.duration_seconds,
        s.puntuacion,
        s.resumen_feedback,
        s.feedback_raw,
        s.started_at,
        s.finished_at,
        json_build_object(
          'full_name',  p.full_name,
          'email',      p.email,
          'avatar_url', p.avatar_url
        ) AS profiles,
        json_build_object(
          'titulo',      sc.titulo,
          'descripcion', sc.descripcion
        ) AS scenarios,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id',         sm.id,
            'role',       sm.role,
            'content',    sm.content,
            'created_at', sm.sent_at
          ) ORDER BY sm.sent_at)
          FROM public.session_messages sm
          WHERE sm.session_id = s.id
        ), '[]') AS session_messages,
        COALESCE((
          SELECT json_agg(json_build_object(
            'cumplido',   sor.cumplido,
            'comentario', sor.comentario,
            'ejemplo',    sor.ejemplo,
            'scenario_objectives', json_build_object('descripcion', so.descripcion)
          ))
          FROM public.session_objective_results sor
          JOIN public.scenario_objectives so ON so.id = sor.objective_id
          WHERE sor.session_id = s.id
        ), '[]') AS session_objective_results
      FROM public.sessions s
      JOIN public.profiles p  ON p.id  = s.user_id
      JOIN public.scenarios sc ON sc.id = s.scenario_id
      WHERE s.finished_at IS NOT NULL ${userFilter}
      ORDER BY s.started_at DESC
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error('get_all_sessions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions/complete', async (req, res) => {
  const { scenario_id, duration_seconds, puntuacion, resumen, feedback_raw, messages, objective_results, azure_oid } = req.body;
  const client = await pool.connect();
  try {
    const profileResult = await client.query(
      'SELECT id FROM public.profiles WHERE azure_oid = $1', [azure_oid]
    );
    const userId = profileResult.rows[0]?.id;
    if (!userId) return res.status(404).json({ error: 'Usuario no encontrado' });

    await client.query('BEGIN');

    const sessionResult = await client.query(`
      INSERT INTO public.sessions
        (user_id, scenario_id, duration_seconds, puntuacion, resumen_feedback, feedback_raw, finished_at)
      VALUES ($1,$2,$3,$4,$5,$6,now())
      RETURNING id
    `, [userId, scenario_id, duration_seconds, puntuacion, resumen, JSON.stringify(feedback_raw)]);

    const sessionId = sessionResult.rows[0].id;

    for (const msg of (messages || [])) {
      await client.query(
        'INSERT INTO public.session_messages (session_id, role, content) VALUES ($1,$2,$3)',
        [sessionId, msg.role, msg.content]
      );
    }

    for (const obj of (objective_results || [])) {
      if (!obj.objective_id) continue;
      await client.query(
        'INSERT INTO public.session_objective_results (session_id, objective_id, cumplido, comentario, ejemplo) VALUES ($1,$2,$3,$4,$5)',
        [sessionId, obj.objective_id, obj.cumplido, obj.comentario || null, obj.ejemplo || null]
      );
    }

    await client.query('COMMIT');
    res.json(sessionId);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('save_complete_session:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.post('/api/sessions/partial', async (req, res) => {
  const { session_id, scenario_id, messages, azure_oid } = req.body;
  const client = await pool.connect();
  try {
    const profileResult = await client.query(
      'SELECT id FROM public.profiles WHERE azure_oid = $1', [azure_oid]
    );
    const userId = profileResult.rows[0]?.id;
    if (!userId) return res.status(404).json({ error: 'Usuario no encontrado' });

    await client.query('BEGIN');

    let sessionId = session_id;

    if (!sessionId) {
      const result = await client.query(
        'INSERT INTO public.sessions (user_id, scenario_id, started_at) VALUES ($1,$2,now()) RETURNING id',
        [userId, scenario_id]
      );
      sessionId = result.rows[0].id;
    } else {
      await client.query('DELETE FROM public.session_messages WHERE session_id = $1', [sessionId]);
    }

    for (const msg of (messages || [])) {
      await client.query(
        'INSERT INTO public.session_messages (session_id, role, content) VALUES ($1,$2,$3)',
        [sessionId, msg.role, msg.content]
      );
    }

    await client.query('COMMIT');
    res.json(sessionId);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('save_partial_session:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/sessions/in-progress', async (req, res) => {
  const { scenario_id, profile_id } = req.query;
  try {
    const result = await q(`
      SELECT s.*,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', sm.id, 'role', sm.role, 'content', sm.content, 'sent_at', sm.sent_at
          ) ORDER BY sm.sent_at)
          FROM public.session_messages sm WHERE sm.session_id = s.id
        ), '[]') AS session_messages
      FROM public.sessions s
      WHERE s.scenario_id = $1 AND s.user_id = $2 AND s.finished_at IS NULL
      ORDER BY s.started_at DESC
      LIMIT 1
    `, [scenario_id, profile_id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions/last-completed', async (req, res) => {
  const { scenario_id, profile_id } = req.query;
  try {
    const result = await q(`
      SELECT id, started_at, finished_at
      FROM public.sessions
      WHERE scenario_id = $1 AND user_id = $2 AND finished_at IS NOT NULL
      ORDER BY finished_at DESC
      LIMIT 1
    `, [scenario_id, profile_id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await q('DELETE FROM public.sessions WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions/finish', async (req, res) => {
  const { session_id, azure_oid, scenario_id } = req.body;
  try {
    const profileResult = await q('SELECT id FROM public.profiles WHERE azure_oid = $1', [azure_oid]);
    const userId = profileResult.rows[0]?.id;
    if (!userId) return res.status(404).json({ error: 'Usuario no encontrado' });

    const result = await q(`
      INSERT INTO public.sessions (id, user_id, scenario_id, finished_at)
      VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, now())
      ON CONFLICT (id) DO UPDATE SET finished_at = now()
      RETURNING id
    `, [session_id || null, userId, scenario_id]);

    res.json(result.rows[0].id);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions/cleanup', async (req, res) => {
  const { scenario_id, azure_oid } = req.body;
  try {
    const profileResult = await q('SELECT id FROM public.profiles WHERE azure_oid = $1', [azure_oid]);
    const userId = profileResult.rows[0]?.id;
    if (!userId) return res.json({ ok: true });

    await q(`
      DELETE FROM public.sessions
      WHERE scenario_id = $1 AND user_id = $2 AND finished_at IS NULL
    `, [scenario_id, userId]);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── START ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API server corriendo en http://localhost:${PORT}`);
});
