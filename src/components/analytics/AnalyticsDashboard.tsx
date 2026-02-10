import { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, CheckCircle2, Clock, Target, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import type { TaskPriority, TaskCategory } from '@/types/diary';

interface Task {
  id: string;
  title: string;
  progress: number;
  completed: boolean;
  priority: TaskPriority;
  category?: TaskCategory;
  createdAt: Date;
  dueDate?: string;
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  createdAt: Date;
}

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#eab308',
  low: '#22c55e',
};

const CATEGORY_COLORS = {
  work: '#3b82f6',
  health: '#22c55e',
  personal: '#a855f7',
  learning: '#f59e0b',
  finance: '#14b8a6',
  other: '#6b7280',
};

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  work: 'Work',
  health: 'Health',
  personal: 'Personal',
  learning: 'Learning',
  finance: 'Finance',
  other: 'Other',
};

export function AnalyticsDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);

      const [tasksResult, goalsResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, progress, completed, priority, category, created_at, due_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('goals')
          .select('id, title, progress, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (tasksResult.error) {
        console.error('Error fetching tasks:', tasksResult.error);
      } else {
        setTasks(tasksResult.data.map(t => ({
          id: t.id,
          title: t.title,
          progress: t.progress,
          completed: t.completed,
          priority: (t.priority as TaskPriority) || 'medium',
          category: (t.category as TaskCategory) || undefined,
          createdAt: new Date(t.created_at),
          dueDate: t.due_date || undefined,
        })));
      }

      if (goalsResult.error) {
        console.error('Error fetching goals:', goalsResult.error);
      } else {
        setGoals(goalsResult.data.map(g => ({
          id: g.id,
          title: g.title,
          progress: g.progress,
          createdAt: new Date(g.created_at),
        })));
      }

      setIsLoading(false);
    };

    fetchData();
  }, [user]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const avgProgress = totalTasks > 0 ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / totalTasks) : 0;
    const avgGoalProgress = goals.length > 0 ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length) : 0;
    
    const highPriorityCompleted = tasks.filter(t => t.priority === 'high' && t.completed).length;
    const highPriorityTotal = tasks.filter(t => t.priority === 'high').length;
    
    return {
      totalTasks,
      completedTasks,
      completionRate,
      avgProgress,
      avgGoalProgress,
      totalGoals: goals.length,
      highPriorityCompleted,
      highPriorityTotal,
    };
  }, [tasks, goals]);

  // Priority breakdown data
  const priorityData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => {
      counts[t.priority]++;
    });
    return [
      { name: 'High', value: counts.high, color: PRIORITY_COLORS.high },
      { name: 'Medium', value: counts.medium, color: PRIORITY_COLORS.medium },
      { name: 'Low', value: counts.low, color: PRIORITY_COLORS.low },
    ].filter(d => d.value > 0);
  }, [tasks]);

  // Category breakdown data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.category) {
        counts[t.category] = (counts[t.category] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: CATEGORY_LABELS[key as TaskCategory] || key,
      value,
      color: CATEGORY_COLORS[key as TaskCategory] || '#6b7280',
    }));
  }, [tasks]);

  // Tasks completed over the last 7 days
  const weeklyData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return last7Days.map(day => {
      const dayStart = startOfDay(day);
      const tasksCreatedOnDay = tasks.filter(t => {
        const taskDate = startOfDay(t.createdAt);
        return taskDate.getTime() === dayStart.getTime();
      });
      const completedOnDay = tasksCreatedOnDay.filter(t => t.completed).length;
      
      return {
        day: format(day, 'EEE'),
        created: tasksCreatedOnDay.length,
        completed: completedOnDay,
      };
    });
  }, [tasks]);

  // Progress by category
  const categoryProgressData = useMemo(() => {
    const categoryStats: Record<string, { total: number; completed: number }> = {};
    
    tasks.forEach(t => {
      const cat = t.category || 'uncategorized';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, completed: 0 };
      }
      categoryStats[cat].total++;
      if (t.completed) {
        categoryStats[cat].completed++;
      }
    });

    return Object.entries(categoryStats)
      .filter(([key]) => key !== 'uncategorized')
      .map(([key, value]) => ({
        name: CATEGORY_LABELS[key as TaskCategory] || key,
        completion: value.total > 0 ? Math.round((value.completed / value.total) * 100) : 0,
        fill: CATEGORY_COLORS[key as TaskCategory] || '#6b7280',
      }));
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-burgundy" />
        <h2 className="font-display text-2xl text-foreground">Productivity Analytics</h2>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-2 border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-burgundy/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-burgundy" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-burgundy">{stats.completionRate}%</p>
                <p className="text-xs text-muted-foreground font-body">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Target className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-gold">{stats.completedTasks}/{stats.totalTasks}</p>
                <p className="text-xs text-muted-foreground font-body">Tasks Done</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-burgundy/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-burgundy" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-burgundy">{stats.avgGoalProgress}%</p>
                <p className="text-xs text-muted-foreground font-body">Goal Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Flame className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-red-500">{stats.highPriorityCompleted}/{stats.highPriorityTotal}</p>
                <p className="text-xs text-muted-foreground font-body">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card className="bg-card border-2 border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.some(d => d.created > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }} 
                  />
                  <Bar dataKey="created" fill="hsl(var(--muted-foreground))" name="Created" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="hsl(var(--gold))" name="Completed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground font-body italic">
                No activity data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="bg-card border-2 border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {priorityData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm font-body">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground font-body italic">
                No tasks yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="bg-card border-2 border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Tasks by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {categoryData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm font-body">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground font-body italic">
                No categorized tasks yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Completion Rates */}
        <Card className="bg-card border-2 border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Completion by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={categoryProgressData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Completion']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }} 
                  />
                  <Bar dataKey="completion" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground font-body italic">
                No categorized tasks yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      {goals.length > 0 && (
        <Card className="bg-card border-2 border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Goals Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-body">{goal.title}</span>
                    <span className="font-display font-bold text-gold">{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-burgundy to-gold transition-all duration-500"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decorative Ornament */}
      <div className="h-8 ornament opacity-30" />
    </div>
  );
}