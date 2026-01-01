import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { DiaryEntry } from '@/components/diary/DiaryEntry';
import { DiaryCalendar } from '@/components/diary/DiaryCalendar';
import { TasksPage } from '@/components/tasks/TasksPage';
import { ProjectsPage } from '@/components/projects/ProjectsPage';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, CalendarDays, PenLine } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('diary');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diaryView, setDiaryView] = useState<'write' | 'calendar'>('write');
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background parchment-texture flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading thy chronicle...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
        
        {activeTab === 'projects' && <ProjectsPage />}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-gold/20 bg-card/50 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="font-body text-muted-foreground italic">
            "We know what we are, but know not what we may be."
          </p>
          <p className="font-display text-sm text-muted-foreground mt-2">
            — The Chronicler, Anno Domini {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
