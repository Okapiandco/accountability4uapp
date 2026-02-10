import { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { Sparkles, Check, Plus, Loader2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TomorrowGoalProps {
  date: Date;
}

interface TomorrowGoalData {
  id: string;
  goal_text: string;
  target_date: string;
  completed: boolean;
}

const MOTIVATIONAL_PROMPTS = [
  "What small step will bring you joy tomorrow?",
  "One act of kindness you'll do for yourself tomorrow?",
  "What will make tomorrow meaningful?",
  "Your single intention for tomorrow:",
  "What will you do to nurture your spirit?",
];

export function TomorrowGoal({ date }: TomorrowGoalProps) {
  const [goal, setGoal] = useState<TomorrowGoalData | null>(null);
  const [newGoalText, setNewGoalText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rolledOverGoal, setRolledOverGoal] = useState<TomorrowGoalData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const tomorrowDate = format(addDays(date, 1), 'yyyy-MM-dd');
  const todayString = format(date, 'yyyy-MM-dd');

  // Check for rolled over goals (uncompleted goals from previous days)
  const checkRolledOverGoals = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tomorrows_goals')
      .select('id, goal_text, target_date, completed')
      .eq('user_id', user.id)
      .eq('completed', false)
      .lt('target_date', todayString)
      .order('target_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setRolledOverGoal(data);
    }
  }, [user, todayString]);

  const fetchGoal = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tomorrows_goals')
        .select('id, goal_text, target_date, completed')
        .eq('user_id', user.id)
        .eq('target_date', tomorrowDate)
        .maybeSingle();

      if (error) throw error;
      setGoal(data);
      
      await checkRolledOverGoals();
    } catch (error: any) {
      console.error('Error fetching goal:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, tomorrowDate, checkRolledOverGoals]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  const handleAddGoal = async () => {
    if (!user || !newGoalText.trim()) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('tomorrows_goals')
        .insert({
          user_id: user.id,
          goal_text: newGoalText.trim(),
          target_date: tomorrowDate,
        })
        .select()
        .single();

      if (error) throw error;
      setGoal(data);
      setNewGoalText('');
      toast({
        title: "Goal set!",
        description: "Tomorrow's intention has been recorded.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async (goalData: TomorrowGoalData) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const newCompleted = !goalData.completed;
      const { error } = await supabase
        .from('tomorrows_goals')
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', goalData.id);

      if (error) throw error;

      if (goalData.id === goal?.id) {
        setGoal({ ...goalData, completed: newCompleted });
      }
      if (goalData.id === rolledOverGoal?.id) {
        setRolledOverGoal(null);
      }

      toast({
        title: newCompleted ? "Goal achieved!" : "Goal reopened",
        description: newCompleted 
          ? "You're building momentum. Keep going!" 
          : "Keep pushing forward, you've got this.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const randomPrompt = MOTIVATIONAL_PROMPTS[Math.floor(Math.random() * MOTIVATIONAL_PROMPTS.length)];

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-gold/5 to-burgundy/5 border-2 border-gold/20">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gold/5 to-burgundy/5 border-2 border-gold/20 shadow-parchment">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-lg text-burgundy">
          <Sparkles className="w-5 h-5 text-gold" />
          Tomorrow's Joy
        </CardTitle>
        <p className="text-sm text-muted-foreground italic">
          "Set your course, and the stars shall guide thee"
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rolled over goal from previous days */}
        {rolledOverGoal && (
          <div className="p-3 bg-burgundy/10 rounded-lg border border-burgundy/20">
            <div className="flex items-center gap-2 text-sm text-burgundy mb-2">
              <RotateCcw className="w-4 h-4" />
              <span className="font-medium">Carried forward from {format(new Date(rolledOverGoal.target_date), 'MMM d')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id={`rolled-${rolledOverGoal.id}`}
                checked={rolledOverGoal.completed}
                onCheckedChange={() => handleToggleComplete(rolledOverGoal)}
                className="border-burgundy data-[state=checked]:bg-burgundy"
              />
              <label
                htmlFor={`rolled-${rolledOverGoal.id}`}
                className="font-body text-foreground cursor-pointer"
              >
                {rolledOverGoal.goal_text}
              </label>
            </div>
          </div>
        )}

        {/* Tomorrow's goal */}
        {goal ? (
          <div className="flex items-center gap-3 p-3 bg-parchment/50 rounded-lg">
            <Checkbox
              id={`goal-${goal.id}`}
              checked={goal.completed}
              onCheckedChange={() => handleToggleComplete(goal)}
              className="border-gold data-[state=checked]:bg-gold"
            />
            <label
              htmlFor={`goal-${goal.id}`}
              className={`font-body text-foreground cursor-pointer flex-1 ${goal.completed ? 'line-through text-muted-foreground' : ''}`}
            >
              {goal.goal_text}
            </label>
            {goal.completed && <Check className="w-5 h-5 text-gold" />}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{randomPrompt}</p>
            <div className="flex gap-2">
              <Input
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="One thing that will bring you joy..."
                className="bg-parchment/50 border-border focus:border-gold"
                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              />
              <Button
                onClick={handleAddGoal}
                disabled={isSaving || !newGoalText.trim()}
                size="icon"
                className="bg-gold hover:bg-gold-light text-foreground shrink-0"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
