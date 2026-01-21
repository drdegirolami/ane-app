-- Add total_score column to form_responses for storing calculated test scores
ALTER TABLE public.form_responses 
ADD COLUMN total_score integer DEFAULT NULL;