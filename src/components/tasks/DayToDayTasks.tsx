import { useState, useEffect, useMemo } from 'react';
import { Trash2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, isLastDayOfMonth, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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

export function DayToDayTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
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

    fetchTasks();
  }, [user, toast]);

  // Toggle task completion
  const toggleTaskCompletion = async (taskId: string, currentCompleted: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !currentCompleted })
      .eq('id', taskId);

    if (error) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !currentCompleted } : t
    ));
  };

  // Delete task
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
      title: "Task removed",
      description: "Task deleted. Keep pushing forward!",
    });
  };

  // Move task to next month
  const moveTaskToNextMonth = async (taskId: string) => {
    const newDueDate = addMonths(new Date(), 1);
    
    const { error } = await supabase
      .from('tasks')
      .update({
        due_date: format(newDueDate, 'yyyy-MM-dd'),
        completed: false,
      })
      .eq('id', taskId);

    if (error) {
      toast({
        title: "Error moving task",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, dueDate: format(newDueDate, 'yyyy-MM-dd'), completed: false } 
        : t
    ));

    toast({
      title: "Task moved",
      description: "Task moved to next month. Stay focused!",
    });
  };

  // Filter tasks by selected month
  const monthlyTasks = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    return tasks.filter(task => {
      const taskDate = task.dueDate ? parseISO(task.dueDate) : task.createdAt;
      const isInMonth = isWithinInterval(taskDate, { start: monthStart, end: monthEnd });
      return isInMonth;
    });
  }, [tasks, selectedMonth]);

  // Check if today is the last day of the selected month
  const isLastDayOfSelectedMonth = isLastDayOfMonth(new Date()) && 
    format(new Date(), 'yyyy-MM') === format(selectedMonth, 'yyyy-MM');

  // Incomplete tasks for end of month prompt
  const incompleteTasks = monthlyTasks.filter(t => !t.completed);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background parchment-texture flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading your tasks...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const completedCount = monthlyTasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-background parchment-texture py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-3xl md:text-4xl text-burgundy">Day to Day Tasks</h1>
            <p className="text-muted-foreground font-body">Focus on what matters today</p>
          </div>

          {/* Month Navigation */}
          <Card className="bg-card border-2 border-gold/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="text-center">
                  <h2 className="font-display text-xl text-foreground">
                    {format(selectedMonth, 'MMMM yyyy')}
                  </h2>
                  <p className="text-sm text-muted-foreground font-body">
                    {completedCount} of {monthlyTasks.length} complete
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* End of Month Reminder */}
          {isLastDayOfSelectedMonth && incompleteTasks.length > 0 && (
            <Card className="bg-gradient-to-r from-burgundy/10 to-gold/10 border-2 border-gold/40">
              <CardContent className="p-4">
                <p className="text-sm font-body text-foreground mb-3">
                  🎯 It's the last day of the month! You have {incompleteTasks.length} incomplete task{incompleteTasks.length > 1 ? 's' : ''}. What's your move?
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tasks List */}
          {monthlyTasks.length > 0 ? (
            <Card className="bg-card border-2 border-gold/20">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {monthlyTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded hover:bg-muted/50 transition-colors border border-gold/10"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskCompletion(task.id, task.completed)}
                        className="h-5 w-5 rounded border-2 border-gold/40 text-burgundy cursor-pointer accent-burgundy"
                      />
                      <span
                        className={`flex-1 font-body text-sm ${
                          task.completed
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex gap-1">
                        {!task.completed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveTaskToNextMonth(task.id)}
                            className="h-7 w-7 p-0 hover:text-muted-foreground"
                            title="Move to next month"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTask(task.id)}
                          className="h-7 w-7 p-0 hover:text-destructive"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-2 border-gold/20">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground font-body italic">
                  No tasks for {format(selectedMonth, 'MMMM yyyy')}. Enjoy your freedom! 🌟
                </p>
              </CardContent>
            </Card>
          )}

          {/* Completed Tasks History (if viewing past month) */}
          {completedCount > 0 && (
            <div className="text-center text-sm text-muted-foreground font-body">
              <p>✅ {completedCount} task{completedCount > 1 ? 's' : ''} completed this month</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
