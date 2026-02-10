import { useState, lazy, Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { DiaryEntry } from '@/components/diary/DiaryEntry';
import { DiaryCalendar } from '@/components/diary/DiaryCalendar';
import { TasksPage } from '@/components/tasks/TasksPage';
import { DayToDayTasks } from '@/components/tasks/DayToDayTasks';
import { BucketList } from '@/components/goals/BucketList';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, CalendarDays, PenLine } from 'lucide-react';

// Lazy load heavy components (recharts in analytics, projects not persisted)
const AnalyticsDashboard = lazy(() => import('@/components/analytics/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const ProjectsPage = lazy(() => import('@/components/projects/ProjectsPage').then(m => ({ default: m.ProjectsPage })));

const TabFallback = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const Index = () => {
  const [activeTab, setActiveTab] = useState('diary');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diaryView, setDiaryView] = useState<'write' | 'calendar'>('write');
  const { signOut } = useAuth();

  const handleCalendarDateSelect = (date: Date) => {
    setCurrentDate(date);
    setDiaryView('write');
  };

  return (
    <div className="min-h-screen bg-background parchment-texture">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        {activeTab === 'diary' && (
          <div className="flex gap-2">
            <Button
              variant={diaryView === 'write' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDiaryView('write')}
              className={diaryView === 'write' ? 'bg-burgundy hover:bg-burgundy-light' : ''}
            >
              <PenLine className="w-4 h-4 mr-2" />
              Write Entry
            </Button>
            <Button
              variant={diaryView === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDiaryView('calendar')}
              className={diaryView === 'calendar' ? 'bg-burgundy hover:bg-burgundy-light' : ''}
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Calendar View
            </Button>
          </div>
        )}
        {activeTab !== 'diary' && <div />}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-muted-foreground hover:text-burgundy"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <main className="container mx-auto px-4 py-8">
        <ErrorBoundary>
          {activeTab === 'diary' && diaryView === 'write' && (
            <DiaryEntry
              date={currentDate}
              onDateChange={setCurrentDate}
            />
          )}

          {activeTab === 'diary' && diaryView === 'calendar' && (
            <DiaryCalendar
              selectedDate={currentDate}
              onSelectDate={handleCalendarDateSelect}
            />
          )}

          {activeTab === 'tasks' && <TasksPage />}

          {activeTab === 'day-to-day' && <DayToDayTasks />}

          {activeTab === 'bucketlist' && <BucketList />}

          {activeTab === 'analytics' && (
            <Suspense fallback={<TabFallback />}>
              <AnalyticsDashboard />
            </Suspense>
          )}

          {activeTab === 'projects' && (
            <Suspense fallback={<TabFallback />}>
              <ProjectsPage />
            </Suspense>
          )}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-gold/20 bg-card/50 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="font-body text-muted-foreground italic">
            "The journey to success is paved with organized dreams."
          </p>
          <p className="font-display text-sm text-muted-foreground mt-2">
            — Velomentum {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
