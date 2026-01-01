import { useState, useEffect, useMemo } from 'react';
import { Target, Plus, Sparkles, CalendarDays, Filter, Repeat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { TaskCard } from './TaskCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { TaskPriority, TaskCategory, TaskRecurrence } from '@/types/diary';

interface Task {
  id: string;
  title: string;
  description?: string;
  progress: number;
  completed: boolean;
  dueDate?: string;
  priority: TaskPriority;
  category?: TaskCategory;
  recurrence?: TaskRecurrence;
  parentTaskId?: string;
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
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory | undefined>(undefined);
  const [newTaskRecurrence, setNewTaskRecurrence] = useState<TaskRecurrence | undefined>(undefined);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState<Date | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
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
          priority: (t.priority as TaskPriority) || 'medium',
          category: (t.category as TaskCategory) || undefined,
          recurrence: (t.recurrence as TaskRecurrence) || undefined,
          parentTaskId: t.parent_task_id || undefined,
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
        priority: newTaskPriority,
        category: newTaskCategory || null,
        recurrence: newTaskRecurrence || null,
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
      priority: (data.priority as TaskPriority) || 'medium',
      category: (data.category as TaskCategory) || undefined,
      recurrence: (data.recurrence as TaskRecurrence) || undefined,
      createdAt: new Date(data.created_at),
    };
    
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskDueDate(undefined);
    setNewTaskPriority('medium');
    setNewTaskCategory(undefined);
    setNewTaskRecurrence(undefined);
    toast({
      title: "Quest added!",
      description: newTaskRecurrence ? `This quest shall repeat ${newTaskRecurrence}.` : "A new endeavour awaits thee.",
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
        priority: updatedTask.priority,
        category: updatedTask.category || null,
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

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const categoryMatch = filterCategory === 'all' || task.category === filterCategory;
      const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
      return categoryMatch && priorityMatch;
    });
  }, [tasks, filterCategory, filterPriority]);

  const hasActiveFilters = filterCategory !== 'all' || filterPriority !== 'all';

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-burgundy" />
              <h2 className="font-display text-2xl text-foreground">Daily Quests</h2>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as TaskCategory | 'all')}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="work">💼 Work</SelectItem>
                <SelectItem value="health">🏃 Health</SelectItem>
                <SelectItem value="personal">🏠 Personal</SelectItem>
                <SelectItem value="learning">📚 Learning</SelectItem>
                <SelectItem value="finance">💰 Finance</SelectItem>
                <SelectItem value="other">📌 Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as TaskPriority | 'all')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    High
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Medium
                  </span>
                </SelectItem>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Low
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setFilterCategory('all');
                  setFilterPriority('all');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear filters
              </Button>
            )}
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
              <div className="flex gap-2">
                <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as TaskPriority)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Low
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="high">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        High
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newTaskCategory || ''} onValueChange={(v) => setNewTaskCategory(v as TaskCategory || undefined)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">💼 Work</SelectItem>
                    <SelectItem value="health">🏃 Health</SelectItem>
                    <SelectItem value="personal">🏠 Personal</SelectItem>
                    <SelectItem value="learning">📚 Learning</SelectItem>
                    <SelectItem value="finance">💰 Finance</SelectItem>
                    <SelectItem value="other">📌 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                <Select value={newTaskRecurrence || 'none'} onValueChange={(v) => setNewTaskRecurrence(v === 'none' ? undefined : v as TaskRecurrence)}>
                <SelectTrigger className="w-full">
                  <Repeat className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="No recurrence (one-time task)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No recurrence</SelectItem>
                  <SelectItem value="daily">🔄 Repeats Daily</SelectItem>
                  <SelectItem value="weekly">📅 Repeats Weekly</SelectItem>
                  <SelectItem value="monthly">🗓️ Repeats Monthly</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Task List */}
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            ))}
            {filteredTasks.length === 0 && tasks.length > 0 && (
              <p className="text-center text-muted-foreground font-body italic py-8">
                No quests match thy filters. Try adjusting them.
              </p>
            )}
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