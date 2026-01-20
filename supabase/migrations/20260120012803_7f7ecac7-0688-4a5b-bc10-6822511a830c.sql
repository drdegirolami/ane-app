-- Drop existing table if partially created
DROP TABLE IF EXISTS public.patient_next_steps;

-- Create table for patient next steps (drip content)
CREATE TABLE public.patient_next_steps (
  patient_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  next_step_slug text NOT NULL,
  next_step_title text NOT NULL,
  next_step_url text NOT NULL,
  available boolean NOT NULL DEFAULT false,
  available_from timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patient_next_steps ENABLE ROW LEVEL SECURITY;

-- Patient can only read their own row
CREATE POLICY "Patients can view their own next step"
ON public.patient_next_steps
FOR SELECT
USING (patient_id = auth.uid());

-- Admin can manage all rows (using correct has_role signature)
CREATE POLICY "Admins can manage all next steps"
ON public.patient_next_steps
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to auto-update updated_at
CREATE TRIGGER update_patient_next_steps_updated_at
BEFORE UPDATE ON public.patient_next_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();