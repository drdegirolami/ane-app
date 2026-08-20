ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS program_start_date date;
UPDATE public.profiles SET program_start_date = created_at::date WHERE program_start_date IS NULL;