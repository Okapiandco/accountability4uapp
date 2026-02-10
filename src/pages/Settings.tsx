import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-display font-semibold">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <NotificationSettings />

        <div className="text-center text-sm text-muted-foreground font-body pt-4">
          <p>Logged in as {user?.email}</p>
        </div>
      </main>
    </div>
  );
};

export default Settings;
