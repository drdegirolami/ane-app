
CREATE TABLE public.patient_form_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  form_slug text NOT NULL,
  first_accessed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, form_slug)
);

ALTER TABLE public.patient_form_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own form access"
  ON public.patient_form_access FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can insert own form access"
  ON public.patient_form_access FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Admins can manage all form access"
  ON public.patient_form_access FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
