-- Add category column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN category text DEFAULT NULL;