import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { DiaryEntry } from '@/components/diary/DiaryEntry';
import { TasksPage } from '@/components/tasks/TasksPage';
import { ProjectsPage } from '@/components/projects/ProjectsPage';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('diary');
  const [currentDate, setCurrentDate] = useState(new Date());
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

  return (
    <div className="min-h-screen bg-background parchment-texture">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="container mx-auto px-4 py-2 flex justify-end">
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
        {activeTab === 'diary' && (
          <DiaryEntry 
            date={currentDate} 
            onDateChange={setCurrentDate} 
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
