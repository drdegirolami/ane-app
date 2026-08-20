CREATE TABLE public.clinical_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  session_type text NOT NULL DEFAULT 'seguimiento',
  program_month integer,
  motive text,
  evolution text,
  indications text,
  next_steps text,
  alerts text,
  private_notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_sessions TO authenticated;
GRANT ALL ON public.clinical_sessions TO service_role;

ALTER TABLE public.clinical_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage clinical sessions"
ON public.clinical_sessions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_clinical_sessions_patient ON public.clinical_sessions(patient_id, session_date DESC);

CREATE TRIGGER update_clinical_sessions_updated_at
BEFORE UPDATE ON public.clinical_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();