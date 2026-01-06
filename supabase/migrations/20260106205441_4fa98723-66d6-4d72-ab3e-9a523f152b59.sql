-- Create table for tomorrow's goal (one daily goal that rolls over if not completed)
CREATE TABLE public.tomorrows_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_text TEXT NOT NULL,
  target_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tomorrows_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tomorrow goals" 
ON public.tomorrows_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tomorrow goals" 
ON public.tomorrows_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tomorrow goals" 
ON public.tomorrows_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tomorrow goals" 
ON public.tomorrows_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for bucket list items
CREATE TABLE public.bucket_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_text TEXT NOT NULL,
  category TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bucket_list ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own bucket list" 
ON public.bucket_list 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bucket list items" 
ON public.bucket_list 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bucket list items" 
ON public.bucket_list 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bucket list items" 
ON public.bucket_list 
FOR DELETE 
USING (auth.uid() = user_id);