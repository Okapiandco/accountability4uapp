import { useState } from 'react';
import { Plus, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TaskCard } from './TaskCard';
import { Slider } from '@/components/ui/slider';
import type { Task, Goal } from '@/types/diary';
import { useToast } from '@/hooks/use-toast';

const initialTasks: Task[] = [
  { id: '1', title: 'Complete the morning meditation', progress: 60, completed: false, createdAt: new Date() },
  { id: '2', title: 'Read a chapter of philosophy', progress: 100, completed: true, createdAt: new Date() },
  { id: '3', title: 'Practice thy craft for one hour', progress: 30, completed: false, createdAt: new Date() },
];

const initialGoals: Goal[] = [
  { id: '1', title: 'Master the art of public speaking', progress: 45, createdAt: new Date() },
  { id: '2', title: 'Complete 365 days of journaling', progress: 12, createdAt: new Date() },
];

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const { toast } = useToast();

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      progress: 0,
      completed: false,
      createdAt: new Date(),
    };
    
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    toast({
      title: "Quest added!",
      description: "A new endeavour awaits thee.",
    });
  };

  const addGoal = () => {
    if (!newGoalTitle.trim()) return;
    
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: newGoalTitle,
      progress: 0,
      createdAt: new Date(),
    };
    
    setGoals(prev => [newGoal, ...prev]);
    setNewGoalTitle('');
    toast({
      title: "Ambition declared!",
      description: "Thy grand goal hath been recorded.",
    });
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Quest removed",
      description: "The task hath been struck from the record.",
    });
  };

  const updateGoalProgress = (id: string, progress: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress } : g));
  };

  const deleteGoal = (id: string) => {
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
            <CardContent className="p-4">
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
            <CardContent className="p-4">
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