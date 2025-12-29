import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { DiaryEntry } from '@/components/diary/DiaryEntry';
import { TasksPage } from '@/components/tasks/TasksPage';
import { ProjectsPage } from '@/components/projects/ProjectsPage';

const Index = () => {
  const [activeTab, setActiveTab] = useState('diary');
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="min-h-screen bg-background parchment-texture">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
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