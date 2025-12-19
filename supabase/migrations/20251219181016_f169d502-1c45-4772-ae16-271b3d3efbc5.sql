
-- Drop the old weekly_planning table since we're changing the concept
DROP TABLE IF EXISTS public.weekly_planning;

-- Create new patient_planning table for individual PDF uploads
CREATE TABLE public.patient_planning (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.patient_planning ENABLE ROW LEVEL SECURITY;

-- Admins can manage all planning documents
CREATE POLICY "Admins can manage planning"
ON public.patient_planning
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Patients can view their own planning documents
CREATE POLICY "Patients can view own planning"
ON public.patient_planning
FOR SELECT
USING (auth.uid() = patient_id);

-- Create storage bucket for planning PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('planning-files', 'planning-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for planning files
CREATE POLICY "Admins can upload planning files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'planning-files' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update planning files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'planning-files' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete planning files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'planning-files' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their planning files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'planning-files');
