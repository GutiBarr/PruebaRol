-- Schema limpio para PostgreSQL local (sin Supabase)
-- Ejecutar como: psql -U postgres -d postgres -f schema-local.sql

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- Tipo de rol
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'superadmin');

-- ─── TABLAS ───────────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
    id          uuid DEFAULT gen_random_uuid() NOT NULL,
    azure_oid   text NOT NULL,
    email       text NOT NULL,
    full_name   text NOT NULL,
    avatar_url  text,
    role        public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    created_at  timestamp with time zone DEFAULT now() NOT NULL,
    updated_at  timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.scenarios (
    id            uuid DEFAULT gen_random_uuid() NOT NULL,
    slug          text NOT NULL,
    titulo        text NOT NULL,
    descripcion   text NOT NULL,
    rol_usuario   text NOT NULL,
    rol_ia        text NOT NULL,
    contexto      text NOT NULL,
    frase_inicial text NOT NULL,
    system_prompt text NOT NULL,
    is_active     boolean DEFAULT true NOT NULL,
    created_by    uuid,
    created_at    timestamp with time zone DEFAULT now() NOT NULL,
    updated_at    timestamp with time zone DEFAULT now() NOT NULL,
    nivel         text DEFAULT 'Trainee'::text NOT NULL,
    competencia   text DEFAULT 'Problem Solving'::text NOT NULL
);

CREATE TABLE public.scenario_objectives (
    id          uuid DEFAULT gen_random_uuid() NOT NULL,
    scenario_id uuid NOT NULL,
    slug        text NOT NULL,
    descripcion text NOT NULL,
    sort_order  integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.sessions (
    id               uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id          uuid NOT NULL,
    scenario_id      uuid NOT NULL,
    duration_seconds integer DEFAULT 0 NOT NULL,
    puntuacion       numeric(3,1),
    resumen_feedback text,
    feedback_raw     jsonb,
    started_at       timestamp with time zone DEFAULT now() NOT NULL,
    finished_at      timestamp with time zone
);

CREATE TABLE public.session_messages (
    id         uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    role       text NOT NULL,
    content    text NOT NULL,
    sent_at    timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT session_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);

CREATE TABLE public.session_objective_results (
    id           uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id   uuid NOT NULL,
    objective_id uuid NOT NULL,
    cumplido     boolean DEFAULT false NOT NULL,
    comentario   text,
    ejemplo      text
);

-- ─── PRIMARY KEYS ─────────────────────────────────────────────────────────────

ALTER TABLE ONLY public.profiles                 ADD CONSTRAINT profiles_pkey                              PRIMARY KEY (id);
ALTER TABLE ONLY public.scenarios                ADD CONSTRAINT scenarios_pkey                             PRIMARY KEY (id);
ALTER TABLE ONLY public.scenario_objectives      ADD CONSTRAINT scenario_objectives_pkey                   PRIMARY KEY (id);
ALTER TABLE ONLY public.sessions                 ADD CONSTRAINT sessions_pkey                              PRIMARY KEY (id);
ALTER TABLE ONLY public.session_messages         ADD CONSTRAINT session_messages_pkey                      PRIMARY KEY (id);
ALTER TABLE ONLY public.session_objective_results ADD CONSTRAINT session_objective_results_pkey            PRIMARY KEY (id);

-- ─── UNIQUE ───────────────────────────────────────────────────────────────────

ALTER TABLE ONLY public.profiles            ADD CONSTRAINT profiles_azure_oid_key UNIQUE (azure_oid);
ALTER TABLE ONLY public.profiles            ADD CONSTRAINT profiles_email_key     UNIQUE (email);
ALTER TABLE ONLY public.scenarios           ADD CONSTRAINT scenarios_slug_key     UNIQUE (slug);
ALTER TABLE ONLY public.scenario_objectives ADD CONSTRAINT scenario_objectives_scenario_id_slug_key UNIQUE (scenario_id, slug);
ALTER TABLE ONLY public.session_objective_results ADD CONSTRAINT session_objective_results_session_id_objective_id_key UNIQUE (session_id, objective_id);

-- ─── FOREIGN KEYS ─────────────────────────────────────────────────────────────

ALTER TABLE ONLY public.scenario_objectives
    ADD CONSTRAINT scenario_objectives_scenario_id_fkey
    FOREIGN KEY (scenario_id) REFERENCES public.scenarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.scenarios
    ADD CONSTRAINT scenarios_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE ONLY public.session_messages
    ADD CONSTRAINT session_messages_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.session_objective_results
    ADD CONSTRAINT session_objective_results_objective_id_fkey
    FOREIGN KEY (objective_id) REFERENCES public.scenario_objectives(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.session_objective_results
    ADD CONSTRAINT session_objective_results_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_scenario_id_fkey
    FOREIGN KEY (scenario_id) REFERENCES public.scenarios(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ─── ÍNDICES ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_profiles_azure_oid   ON public.profiles             USING btree (azure_oid);
CREATE INDEX idx_profiles_role        ON public.profiles             USING btree (role);
CREATE INDEX idx_objectives_scenario  ON public.scenario_objectives  USING btree (scenario_id);
CREATE INDEX idx_sessions_user        ON public.sessions             USING btree (user_id);
CREATE INDEX idx_sessions_scenario    ON public.sessions             USING btree (scenario_id);
CREATE INDEX idx_sessions_user_date   ON public.sessions             USING btree (user_id, started_at DESC);
CREATE INDEX idx_messages_session     ON public.session_messages     USING btree (session_id);
CREATE INDEX idx_obj_results_session  ON public.session_objective_results USING btree (session_id);
