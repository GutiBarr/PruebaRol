--
-- PostgreSQL database dump
--

\restrict BumgHCIbzMI08zqoIHWjqYUL231S8LZ75VnSrtfFT6mepPTjv2XTYJ4crVvxJMS

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin',
    'superadmin'
);


--
-- Name: change_user_role(uuid, public.user_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.change_user_role(target_user_id uuid, new_role public.user_role) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF get_current_role() != 'superadmin' THEN
    RAISE EXCEPTION 'Solo superadmin puede cambiar roles';
  END IF;
  
  UPDATE profiles SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
END;
$$;


--
-- Name: cleanup_pending_sessions(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_pending_sessions(p_scenario_id uuid, p_azure_oid text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Buscamos el ID del usuario
  SELECT id INTO v_user_id FROM public.profiles WHERE azure_oid = p_azure_oid;
  
  IF v_user_id IS NOT NULL THEN
    -- 2. BORRAMOS las sesiones que no se terminaron (en lugar de actualizarlas)
    -- Esto evita que aparezcan en el historial
    DELETE FROM public.sessions
    WHERE scenario_id = p_scenario_id
      AND user_id = v_user_id
      AND finished_at IS NULL;
  END IF;
END;
$$;


--
-- Name: create_scenario_secure(text, text, text, text, text, text, text, text, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_scenario_secure(p_titulo text, p_slug text, p_descripcion text, p_rol_usuario text, p_rol_ia text, p_contexto text, p_frase_inicial text, p_system_prompt text, p_objectives jsonb, p_azure_oid text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_scenario_id uuid;
BEGIN
  -- 1. Verificar si el usuario es admin antes de hacer nada
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE azure_oid = p_azure_oid AND role IN ('admin', 'superadmin')) THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;

  -- 2. Insertar el escenario
  INSERT INTO scenarios (titulo, slug, descripcion, rol_usuario, rol_ia, contexto, frase_inicial, system_prompt)
  VALUES (p_titulo, p_slug, p_descripcion, p_rol_usuario, p_rol_ia, p_contexto, p_frase_inicial, p_system_prompt)
  RETURNING id INTO v_scenario_id;

  -- 3. Insertar objetivos si existen
  IF p_objectives IS NOT NULL THEN
    INSERT INTO scenario_objectives (scenario_id, slug, descripcion)
    SELECT v_scenario_id, (obj->>'slug'), (obj->>'descripcion')
    FROM jsonb_array_elements(p_objectives) AS obj;
  END IF;

  RETURN v_scenario_id;
END;
$$;


--
-- Name: create_scenario_secure(text, text, text, text, text, text, text, text, text, text, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_scenario_secure(p_titulo text, p_slug text, p_descripcion text, p_rol_usuario text, p_rol_ia text, p_contexto text, p_frase_inicial text, p_system_prompt text, p_nivel text, p_competencia text, p_objectives jsonb, p_azure_oid text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_scenario_id uuid;
BEGIN
  -- 1. Verificar si el usuario es admin antes de hacer nada
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE azure_oid = p_azure_oid AND role IN ('admin', 'superadmin')) THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;

  -- 2. Insertar el escenario con los nuevos campos
  INSERT INTO scenarios (titulo, slug, descripcion, rol_usuario, rol_ia, contexto, frase_inicial, system_prompt, nivel, competencia)
  VALUES (p_titulo, p_slug, p_descripcion, p_rol_usuario, p_rol_ia, p_contexto, p_frase_inicial, p_system_prompt, p_nivel, p_competencia)
  RETURNING id INTO v_scenario_id;

  -- 3. Insertar objetivos si existen
  IF p_objectives IS NOT NULL THEN
    INSERT INTO scenario_objectives (scenario_id, slug, descripcion)
    SELECT v_scenario_id, (obj->>'slug'), (obj->>'descripcion')
    FROM jsonb_array_elements(p_objectives) AS obj;
  END IF;

  RETURN v_scenario_id;
END;
$$;


--
-- Name: delete_scenario_secure(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_scenario_secure(p_scenario_id uuid, p_azure_oid text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE azure_oid = p_azure_oid AND role IN ('admin', 'superadmin')) THEN
    RAISE EXCEPTION 'No tienes permisos para borrar escenarios';
  END IF;
  DELETE FROM scenarios WHERE id = p_scenario_id;
END;
$$;


--
-- Name: finish_session(uuid, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.finish_session(p_session_id uuid, p_azure_oid text, p_scenario_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID;
  v_session_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM profiles
  WHERE azure_oid = p_azure_oid;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  INSERT INTO sessions (
    id,
    user_id,
    scenario_id,
    finished_at
  )
  VALUES (
    COALESCE(p_session_id, gen_random_uuid()),
    v_user_id,
    p_scenario_id,
    now()
  )
  ON CONFLICT (id)
  DO UPDATE SET
    finished_at = now()
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;


--
-- Name: get_current_profile_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_profile_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT id FROM profiles 
  WHERE azure_oid = current_setting('app.azure_oid', true)
$$;


--
-- Name: get_current_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_role() RETURNS public.user_role
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM profiles 
  WHERE azure_oid = current_setting('app.azure_oid', true)
$$;


--
-- Name: save_complete_session(uuid, integer, numeric, text, jsonb, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_complete_session(p_scenario_id uuid, p_duration_seconds integer, p_puntuacion numeric, p_resumen text, p_feedback_raw jsonb, p_messages jsonb, p_objective_results jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
  msg JSONB;
  obj JSONB;
BEGIN
  v_user_id := get_current_profile_id();
  
  -- Crear sesión
  INSERT INTO sessions (user_id, scenario_id, duration_seconds, puntuacion, resumen_feedback, feedback_raw, finished_at)
  VALUES (v_user_id, p_scenario_id, p_duration_seconds, p_puntuacion, p_resumen, p_feedback_raw, now())
  RETURNING id INTO v_session_id;
  
  -- Insertar mensajes
  FOR msg IN SELECT * FROM jsonb_array_elements(p_messages) LOOP
    INSERT INTO session_messages (session_id, role, content)
    VALUES (v_session_id, msg->>'role', msg->>'content');
  END LOOP;
  
  -- Insertar resultados de objetivos
  FOR obj IN SELECT * FROM jsonb_array_elements(p_objective_results) LOOP
    INSERT INTO session_objective_results (session_id, objective_id, cumplido, comentario, ejemplo)
    VALUES (v_session_id, (obj->>'objective_id')::UUID, (obj->>'cumplido')::BOOLEAN, obj->>'comentario', obj->>'ejemplo');
  END LOOP;
  
  RETURN v_session_id;
END;
$$;


--
-- Name: save_complete_session(uuid, integer, numeric, text, jsonb, jsonb, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_complete_session(p_scenario_id uuid, p_duration_seconds integer, p_puntuacion numeric, p_resumen text, p_feedback_raw jsonb, p_messages jsonb, p_objective_results jsonb, p_azure_oid text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
  msg JSONB;
  obj JSONB;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE azure_oid = p_azure_oid;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado para azure_oid: %', p_azure_oid;
  END IF;

  INSERT INTO sessions (user_id, scenario_id, duration_seconds, puntuacion, resumen_feedback, feedback_raw, finished_at)
  VALUES (v_user_id, p_scenario_id, p_duration_seconds, p_puntuacion, p_resumen, p_feedback_raw, now())
  RETURNING id INTO v_session_id;
  
  FOR msg IN SELECT * FROM jsonb_array_elements(p_messages) LOOP
    INSERT INTO session_messages (session_id, role, content)
    VALUES (v_session_id, msg->>'role', msg->>'content');
  END LOOP;
  
  FOR obj IN SELECT * FROM jsonb_array_elements(p_objective_results) LOOP
    INSERT INTO session_objective_results (session_id, objective_id, cumplido, comentario, ejemplo)
    VALUES (v_session_id, (obj->>'objective_id')::UUID, (obj->>'cumplido')::BOOLEAN, obj->>'comentario', obj->>'ejemplo');
  END LOOP;
  
  RETURN v_session_id;
END;
$$;


--
-- Name: save_partial_session(uuid, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_partial_session(p_session_id uuid, p_scenario_id uuid, p_messages jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
  msg JSONB;
BEGIN
  v_user_id := get_current_profile_id();
  
  -- Si no hay ID, creamos sesión nueva 'in_progress' (finished_at es NULL)
  IF p_session_id IS NULL THEN
    INSERT INTO sessions (user_id, scenario_id, started_at)
    VALUES (v_user_id, p_scenario_id, now())
    RETURNING id INTO v_session_id;
  ELSE
    v_session_id := p_session_id;
    -- Limpiamos mensajes anteriores para refrescar con los nuevos
    DELETE FROM session_messages WHERE session_id = v_session_id;
  END IF;
  
  -- Insertar los mensajes actuales
  FOR msg IN SELECT * FROM jsonb_array_elements(p_messages) LOOP
    INSERT INTO session_messages (session_id, role, content)
    VALUES (v_session_id, msg->>'role', msg->>'content');
  END LOOP;
  
  RETURN v_session_id;
END;
$$;


--
-- Name: set_config(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_config(name text, value text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  -- Esta instrucción guarda el ID del usuario en la memoria de la sesión
  perform set_config(name, value, false);
end;
$$;


--
-- Name: update_scenario_secure(uuid, text, text, text, text, text, text, text, text, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_scenario_secure(p_scenario_id uuid, p_titulo text, p_slug text, p_descripcion text, p_rol_usuario text, p_rol_ia text, p_contexto text, p_frase_inicial text, p_system_prompt text, p_objectives jsonb, p_azure_oid text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Verificar si el usuario es admin o superadmin
  SELECT role INTO v_user_role FROM profiles WHERE azure_oid = p_azure_oid;
  
  IF v_user_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'No tienes permisos para editar escenarios';
  END IF;

  -- Actualizar el escenario
  UPDATE scenarios
  SET 
    titulo = p_titulo,
    slug = p_slug,
    descripcion = p_descripcion,
    rol_usuario = p_rol_usuario,
    rol_ia = p_rol_ia,
    contexto = p_contexto,
    frase_inicial = p_frase_inicial,
    system_prompt = p_system_prompt,
    updated_at = now()
  WHERE id = p_scenario_id;

  -- Actualizar objetivos (borrar anteriores y crear nuevos)
  DELETE FROM scenario_objectives WHERE scenario_id = p_scenario_id;
  
  INSERT INTO scenario_objectives (scenario_id, slug, descripcion)
  SELECT p_scenario_id, (obj->>'slug'), (obj->>'descripcion')
  FROM jsonb_array_elements(p_objectives) AS obj;

END;
$$;


--
-- Name: update_scenario_secure(uuid, text, text, text, text, text, text, text, text, text, text, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_scenario_secure(p_scenario_id uuid, p_titulo text, p_slug text, p_descripcion text, p_rol_usuario text, p_rol_ia text, p_contexto text, p_frase_inicial text, p_system_prompt text, p_nivel text, p_competencia text, p_objectives jsonb, p_azure_oid text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Verificar si el usuario es admin o superadmin
  SELECT role INTO v_user_role FROM profiles WHERE azure_oid = p_azure_oid;
  
  IF v_user_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'No tienes permisos para editar escenarios';
  END IF;

  -- Actualizar el escenario incluyendo los nuevos campos
  UPDATE scenarios
  SET 
    titulo = p_titulo,
    slug = p_slug,
    descripcion = p_descripcion,
    rol_usuario = p_rol_usuario,
    rol_ia = p_rol_ia,
    contexto = p_contexto,
    frase_inicial = p_frase_inicial,
    system_prompt = p_system_prompt,
    nivel = p_nivel,
    competencia = p_competencia,
    updated_at = now()
  WHERE id = p_scenario_id;

  -- Actualizar objetivos (borrar anteriores y crear nuevos)
  DELETE FROM scenario_objectives WHERE scenario_id = p_scenario_id;
  
  INSERT INTO scenario_objectives (scenario_id, slug, descripcion)
  SELECT p_scenario_id, (obj->>'slug'), (obj->>'descripcion')
  FROM jsonb_array_elements(p_objectives) AS obj;

END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    azure_oid text NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    avatar_url text,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: upsert_profile(text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_profile(p_azure_oid text, p_email text, p_full_name text, p_avatar_url text DEFAULT NULL::text) RETURNS public.profiles
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result profiles;
BEGIN
  INSERT INTO profiles (azure_oid, email, full_name, avatar_url)
  VALUES (p_azure_oid, p_email, p_full_name, p_avatar_url)
  ON CONFLICT (azure_oid) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;


--
-- Name: scenario_objectives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scenario_objectives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    scenario_id uuid NOT NULL,
    slug text NOT NULL,
    descripcion text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: scenarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scenarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    titulo text NOT NULL,
    descripcion text NOT NULL,
    rol_usuario text NOT NULL,
    rol_ia text NOT NULL,
    contexto text NOT NULL,
    frase_inicial text NOT NULL,
    system_prompt text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nivel text DEFAULT 'Trainee'::text NOT NULL,
    competencia text DEFAULT 'Problem Solving'::text NOT NULL
);


--
-- Name: session_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT session_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: session_objective_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_objective_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    objective_id uuid NOT NULL,
    cumplido boolean DEFAULT false NOT NULL,
    comentario text,
    ejemplo text
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    scenario_id uuid NOT NULL,
    duration_seconds integer DEFAULT 0 NOT NULL,
    puntuacion numeric(3,1),
    resumen_feedback text,
    feedback_raw jsonb,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone
);


--
-- Name: profiles profiles_azure_oid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_azure_oid_key UNIQUE (azure_oid);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: scenario_objectives scenario_objectives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenario_objectives
    ADD CONSTRAINT scenario_objectives_pkey PRIMARY KEY (id);


--
-- Name: scenario_objectives scenario_objectives_scenario_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenario_objectives
    ADD CONSTRAINT scenario_objectives_scenario_id_slug_key UNIQUE (scenario_id, slug);


--
-- Name: scenarios scenarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenarios
    ADD CONSTRAINT scenarios_pkey PRIMARY KEY (id);


--
-- Name: scenarios scenarios_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenarios
    ADD CONSTRAINT scenarios_slug_key UNIQUE (slug);


--
-- Name: session_messages session_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_messages
    ADD CONSTRAINT session_messages_pkey PRIMARY KEY (id);


--
-- Name: session_objective_results session_objective_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_objective_results
    ADD CONSTRAINT session_objective_results_pkey PRIMARY KEY (id);


--
-- Name: session_objective_results session_objective_results_session_id_objective_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_objective_results
    ADD CONSTRAINT session_objective_results_session_id_objective_id_key UNIQUE (session_id, objective_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: idx_messages_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_session ON public.session_messages USING btree (session_id);


--
-- Name: idx_obj_results_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_obj_results_session ON public.session_objective_results USING btree (session_id);


--
-- Name: idx_objectives_scenario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_objectives_scenario ON public.scenario_objectives USING btree (scenario_id);


--
-- Name: idx_profiles_azure_oid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_azure_oid ON public.profiles USING btree (azure_oid);


--
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);


--
-- Name: idx_sessions_scenario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_scenario ON public.sessions USING btree (scenario_id);


--
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user ON public.sessions USING btree (user_id);


--
-- Name: idx_sessions_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_date ON public.sessions USING btree (user_id, started_at DESC);


--
-- Name: scenario_objectives scenario_objectives_scenario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenario_objectives
    ADD CONSTRAINT scenario_objectives_scenario_id_fkey FOREIGN KEY (scenario_id) REFERENCES public.scenarios(id) ON DELETE CASCADE;


--
-- Name: scenarios scenarios_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenarios
    ADD CONSTRAINT scenarios_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: session_messages session_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_messages
    ADD CONSTRAINT session_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: session_objective_results session_objective_results_objective_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_objective_results
    ADD CONSTRAINT session_objective_results_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.scenario_objectives(id) ON DELETE CASCADE;


--
-- Name: session_objective_results session_objective_results_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_objective_results
    ADD CONSTRAINT session_objective_results_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_scenario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_scenario_id_fkey FOREIGN KEY (scenario_id) REFERENCES public.scenarios(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: scenarios Admins can create scenarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create scenarios" ON public.scenarios FOR INSERT WITH CHECK ((public.get_current_role() = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])));


--
-- Name: scenario_objectives Admins can manage objectives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage objectives" ON public.scenario_objectives USING ((public.get_current_role() = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])));


--
-- Name: scenarios Admins can update scenarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update scenarios" ON public.scenarios FOR UPDATE USING ((public.get_current_role() = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])));


--
-- Name: session_messages Admins can view all messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all messages" ON public.session_messages FOR SELECT USING ((public.get_current_role() = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])));


--
-- Name: session_objective_results Admins can view all objective results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all objective results" ON public.session_objective_results FOR SELECT USING ((public.get_current_role() = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING ((public.get_current_role() = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])));


--
-- Name: scenarios Admins can view all scenarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all scenarios" ON public.scenarios FOR SELECT USING ((public.get_current_role() = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])));


--
-- Name: sessions Admins can view all sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all sessions" ON public.sessions FOR SELECT USING ((public.get_current_role() = ANY (ARRAY['admin'::public.user_role, 'superadmin'::public.user_role])));


--
-- Name: scenarios Anyone can view active scenarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active scenarios" ON public.scenarios FOR SELECT USING ((is_active = true));


--
-- Name: scenario_objectives Anyone can view objectives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view objectives" ON public.scenario_objectives FOR SELECT USING (true);


--
-- Name: profiles Superadmin can update any profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can update any profile" ON public.profiles FOR UPDATE USING ((public.get_current_role() = 'superadmin'::public.user_role));


--
-- Name: sessions Users can create own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own sessions" ON public.sessions FOR INSERT WITH CHECK ((user_id = public.get_current_profile_id()));


--
-- Name: session_messages Users can delete own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own messages" ON public.session_messages FOR DELETE USING (true);


--
-- Name: session_messages Users can insert own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own messages" ON public.session_messages FOR INSERT WITH CHECK ((session_id IN ( SELECT sessions.id
   FROM public.sessions
  WHERE (sessions.user_id = public.get_current_profile_id()))));


--
-- Name: session_objective_results Users can insert own objective results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own objective results" ON public.session_objective_results FOR INSERT WITH CHECK ((session_id IN ( SELECT sessions.id
   FROM public.sessions
  WHERE (sessions.user_id = public.get_current_profile_id()))));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((azure_oid = current_setting('app.azure_oid'::text, true))) WITH CHECK ((role = ( SELECT profiles_1.role
   FROM public.profiles profiles_1
  WHERE (profiles_1.azure_oid = current_setting('app.azure_oid'::text, true)))));


--
-- Name: session_messages Users can view own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own messages" ON public.session_messages FOR SELECT USING ((session_id IN ( SELECT sessions.id
   FROM public.sessions
  WHERE (sessions.user_id = public.get_current_profile_id()))));


--
-- Name: session_objective_results Users can view own objective results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own objective results" ON public.session_objective_results FOR SELECT USING ((session_id IN ( SELECT sessions.id
   FROM public.sessions
  WHERE (sessions.user_id = public.get_current_profile_id()))));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((azure_oid = current_setting('app.azure_oid'::text, true)));


--
-- Name: sessions Users can view own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING ((user_id = public.get_current_profile_id()));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: scenario_objectives; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scenario_objectives ENABLE ROW LEVEL SECURITY;

--
-- Name: scenarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

--
-- Name: session_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: session_objective_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.session_objective_results ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict BumgHCIbzMI08zqoIHWjqYUL231S8LZ75VnSrtfFT6mepPTjv2XTYJ4crVvxJMS

