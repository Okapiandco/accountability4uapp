import { useState } from 'react';
import { Check, Trash2, Edit2, X, Save, CalendarDays } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority, TaskCategory } from '@/types/diary';

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

const priorityBorderColors = {
  low: 'border-l-green-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-red-500',
};

const categoryLabels: Record<TaskCategory, string> = {
  work: '💼 Work',
  health: '🏃 Health',
  personal: '🏠 Personal',
  learning: '📚 Learning',
  finance: '💰 Finance',
  other: '📌 Other',
};

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    onUpdate({
      ...task,
      progress: newProgress,
      completed: newProgress === 100,
    });
  };

  const handleSaveEdit = () => {
    onUpdate({ ...task, title: editTitle });
    setIsEditing(false);
  };

  const toggleComplete = () => {
    onUpdate({
      ...task,
      completed: !task.completed,
      progress: task.completed ? task.progress : 100,
    });
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    onUpdate({ ...task, priority });
  };

  const handleCategoryChange = (category: TaskCategory | undefined) => {
    onUpdate({ ...task, category });
  };

  return (
    <Card 
      className={cn(
        "bg-card border-2 transition-all duration-300 hover:shadow-parchment border-l-4",
        priorityBorderColors[task.priority],
        task.completed 
          ? "border-gold/40 bg-gold/5" 
          : "border-border hover:border-burgundy/30"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Completion Toggle */}
          <button
            onClick={toggleComplete}
            className={cn(
              "flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all mt-1",
              task.completed
                ? "bg-gold border-gold text-primary-foreground"
                : "border-border hover:border-burgundy"
            )}
          >
            {task.completed && <Check className="w-4 h-4" />}
          </button>

          {/* Task Content */}
          <div className="flex-grow min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="font-body text-lg"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveEdit}>
                  <Save className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <h4 
                    className={cn(
                      "font-body text-lg leading-tight",
                      task.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </h4>
                  <span className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    priorityColors[task.priority]
                  )} />
                </div>
                {task.category && (
                  <span className="text-xs text-muted-foreground font-body">
                    {categoryLabels[task.category]}
                  </span>
                )}
              </div>
            )}

            {/* Progress Slider */}
            {!isEditing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-body">Progress</span>
                  <span className={cn(
                    "font-display font-bold",
                    task.progress === 100 ? "text-gold" : "text-burgundy"
                  )}>
                    {task.progress}%
                  </span>
                </div>
                <Slider
                  value={[task.progress]}
                  onValueChange={handleProgressChange}
                  max={100}
                  step={5}
                  disabled={task.completed}
                />
              </div>
            )}

            {/* Due Date & Priority & Category */}
            {!isEditing && (
              <div className="mt-3 space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {task.dueDate ? (
                        <span>Due: {format(new Date(task.dueDate), 'PPP')}</span>
                      ) : (
                        <span className="text-muted-foreground">Set due date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={task.dueDate ? new Date(task.dueDate) : undefined}
                      onSelect={(date) => onUpdate({ ...task, dueDate: date ? format(date, 'yyyy-MM-dd') : undefined })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex gap-2">
                  <Select value={task.priority} onValueChange={(v) => handlePriorityChange(v as TaskPriority)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
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
                  <Select value={task.category || ''} onValueChange={(v) => handleCategoryChange(v as TaskCategory || undefined)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Category" />
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
              </div>
            )}
          </div>

          {/* Actions */}
          {!isEditing && (
            <div className="flex-shrink-0 flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0 hover:text-burgundy"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(task.id)}
                className="h-8 w-8 p-0 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}