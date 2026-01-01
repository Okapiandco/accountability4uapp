-- Add recurrence columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN recurrence text DEFAULT NULL CHECK (recurrence IN ('daily', 'weekly', 'monthly')),
ADD COLUMN recurrence_end_date date DEFAULT NULL,
ADD COLUMN parent_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
ADD COLUMN last_recurrence_date date DEFAULT NULL;

-- Create index for finding recurring tasks
CREATE INDEX idx_tasks_recurrence ON public.tasks(recurrence) WHERE recurrence IS NOT NULL;

-- Enable pg_cron and pg_net extensions for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;