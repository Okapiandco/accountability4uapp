import { useState, useEffect } from 'react';
import { Target, Plus, Sparkles, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { TaskCard } from './TaskCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  progress: number;
  completed: boolean;
  dueDate?: string;
  createdAt: Date;
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  targetDate?: string;
  createdAt: Date;
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>(undefined);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch tasks from database
  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Error loading tasks",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setTasks(data.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          progress: t.progress,
          completed: t.completed,
          dueDate: t.due_date || undefined,
          createdAt: new Date(t.created_at),
        })));
      }
      setIsLoading(false);
    };

    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching goals:', error);
      } else {
        setGoals(data.map(g => ({
          id: g.id,
          title: g.title,
          progress: g.progress,
          targetDate: g.target_date || undefined,
          createdAt: new Date(g.created_at),
        })));
      }
    };

    fetchTasks();
    fetchGoals();
  }, [user, toast]);

  const addTask = async () => {
    if (!newTaskTitle.trim() || !user) return;
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: newTaskTitle,
        progress: 0,
        completed: false,
        due_date: newTaskDueDate ? format(newTaskDueDate, 'yyyy-MM-dd') : null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error adding task",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const newTask: Task = {
      id: data.id,
      title: data.title,
      progress: data.progress,
      completed: data.completed,
      dueDate: data.due_date || undefined,
      createdAt: new Date(data.created_at),
    };
    
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskDueDate(undefined);
    toast({
      title: "Quest added!",
      description: "A new endeavour awaits thee.",
    });
  };

  const addGoal = async () => {
    if (!newGoalTitle.trim() || !user) return;
    
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: newGoalTitle,
        progress: 0,
        target_date: newGoalTargetDate ? format(newGoalTargetDate, 'yyyy-MM-dd') : null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error adding goal",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const newGoal: Goal = {
      id: data.id,
      title: data.title,
      progress: data.progress,
      targetDate: data.target_date || undefined,
      createdAt: new Date(data.created_at),
    };
    
    setGoals(prev => [newGoal, ...prev]);
    setNewGoalTitle('');
    setNewGoalTargetDate(undefined);
    toast({
      title: "Ambition declared!",
      description: "Thy grand goal hath been recorded.",
    });
  };

  const updateGoalTargetDate = async (id: string, date: Date | undefined) => {
    const { error } = await supabase
      .from('goals')
      .update({ target_date: date ? format(date, 'yyyy-MM-dd') : null })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error updating goal",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setGoals(prev => prev.map(g => g.id === id ? { ...g, targetDate: date ? format(date, 'yyyy-MM-dd') : undefined } : g));
  };

  const updateTask = async (updatedTask: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({
        title: updatedTask.title,
        description: updatedTask.description,
        progress: updatedTask.progress,
        completed: updatedTask.completed,
        due_date: updatedTask.dueDate,
      })
      .eq('id', updatedTask.id);

    if (error) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Quest removed",
      description: "The task hath been struck from the record.",
    });
  };

  const updateGoalProgress = async (id: string, progress: number) => {
    const { error } = await supabase
      .from('goals')
      .update({ progress })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error updating goal",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress } : g));
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error deleting goal",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalProgress = tasks.length > 0 
    ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length) 
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-2 border-gold/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-display font-bold text-burgundy">{tasks.length}</p>
            <p className="text-sm text-muted-foreground font-body">Total Quests</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-2 border-gold/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-display font-bold text-gold">{completedTasks}</p>
            <p className="text-sm text-muted-foreground font-body">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-2 border-gold/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-display font-bold text-burgundy">{totalProgress}%</p>
            <p className="text-sm text-muted-foreground font-body">Avg Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-2 border-gold/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-display font-bold text-gold">{goals.length}</p>
            <p className="text-sm text-muted-foreground font-body">Grand Goals</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Tasks Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-burgundy" />
            <h2 className="font-display text-2xl text-foreground">Daily Quests</h2>
          </div>

          {/* Add Task Form */}
          <Card className="bg-card border-2 border-gold/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What quest dost thou undertake?"
                  className="font-body"
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                />
                <Button 
                  onClick={addTask}
                  className="bg-gradient-to-r from-burgundy to-burgundy-light hover:shadow-gold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {newTaskDueDate ? format(newTaskDueDate, 'PPP') : <span className="text-muted-foreground">Set due date (optional)</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newTaskDueDate}
                    onSelect={setNewTaskDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Task List */}
          <div className="space-y-3">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            ))}
            {tasks.length === 0 && (
              <p className="text-center text-muted-foreground font-body italic py-8">
                No quests yet. Add thy first endeavour above.
              </p>
            )}
          </div>
        </section>

        {/* Goals Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-gold" />
            <h2 className="font-display text-2xl text-foreground">Grand Ambitions</h2>
          </div>

          {/* Add Goal Form */}
          <Card className="bg-card border-2 border-gold/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="What is thy grand ambition?"
                  className="font-body"
                  onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                />
                <Button 
                  onClick={addGoal}
                  className="bg-gradient-to-r from-gold to-gold-light text-secondary-foreground hover:shadow-gold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {newGoalTargetDate ? format(newGoalTargetDate, 'PPP') : <span className="text-muted-foreground">Set target date (optional)</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newGoalTargetDate}
                    onSelect={setNewGoalTargetDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Goals List */}
          <div className="space-y-4">
            {goals.map(goal => (
              <Card key={goal.id} className="bg-card border-2 border-gold/30 shadow-parchment">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-body text-lg font-medium">{goal.title}</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteGoal(goal.id)}
                      className="h-8 w-8 p-0 hover:text-destructive"
                    >
                      ×
                    </Button>
                  </div>
                  
                  {/* Target Date */}
                  <div className="mb-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {goal.targetDate ? (
                            <span>Target: {format(new Date(goal.targetDate), 'PPP')}</span>
                          ) : (
                            <span className="text-muted-foreground">Set target date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={goal.targetDate ? new Date(goal.targetDate) : undefined}
                          onSelect={(date) => updateGoalTargetDate(goal.id, date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-body">Journey Progress</span>
                      <span className="font-display font-bold text-gold text-lg">
                        {goal.progress}%
                      </span>
                    </div>
                    <Slider
                      value={[goal.progress]}
                      onValueChange={(v) => updateGoalProgress(goal.id, v[0])}
                      max={100}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground font-body italic text-center">
                      "The journey of a thousand miles begins with a single step"
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {goals.length === 0 && (
              <p className="text-center text-muted-foreground font-body italic py-8">
                No grand ambitions yet. Dream boldly!
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Decorative Ornament */}
      <div className="h-8 ornament opacity-30" />
    </div>
  );
}