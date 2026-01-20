-- =========================================================
-- MOTOR FLEXIBLE DE FORMULARIOS - MIGRACIÓN COMPLETA
-- =========================================================

-- 1. Tabla form_templates (definición de formularios)
CREATE TABLE public.form_templates (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        UNIQUE NOT NULL,
  title         text        NOT NULL,
  description   text,
  schema_json   jsonb       NOT NULL,
  is_active     boolean     NOT NULL DEFAULT true,
  order_index   int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Índice para ordenar templates activos
CREATE INDEX idx_form_templates_active_order 
  ON public.form_templates (is_active, order_index);

-- 2. Tabla form_responses (respuestas de pacientes)
CREATE TABLE public.form_responses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id   uuid        NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  answers_json  jsonb       NOT NULL,
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, template_id)
);

-- Índices para queries frecuentes
CREATE INDEX idx_form_responses_patient    ON public.form_responses (patient_id);
CREATE INDEX idx_form_responses_template   ON public.form_responses (template_id);
CREATE INDEX idx_form_responses_submitted  ON public.form_responses (submitted_at DESC);

-- 3. Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_form_responses_updated_at
  BEFORE UPDATE ON public.form_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 4. RLS POLICIES - form_templates
-- =========================================================
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: usuarios autenticados pueden leer SOLO templates activos
CREATE POLICY "Authenticated users can read active templates"
  ON public.form_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ALL (INSERT/UPDATE/DELETE): solo admin
CREATE POLICY "Admins can manage all templates"
  ON public.form_templates
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- 5. RLS POLICIES - form_responses
-- =========================================================
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- SELECT: patient lee solo lo suyo; admin lee todo
CREATE POLICY "Patients read own responses, admins read all"
  ON public.form_responses
  FOR SELECT
  TO authenticated
  USING (
    patient_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- INSERT: patient solo puede insertar si patient_id = auth.uid(); admin puede insertar cualquier
CREATE POLICY "Patients insert own responses, admins insert any"
  ON public.form_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- UPDATE: patient actualiza solo lo suyo; admin actualiza todo
CREATE POLICY "Patients update own responses, admins update all"
  ON public.form_responses
  FOR UPDATE
  TO authenticated
  USING (
    patient_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    patient_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- DELETE: solo admin (proteger historial del paciente)
CREATE POLICY "Only admins can delete responses"
  ON public.form_responses
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));