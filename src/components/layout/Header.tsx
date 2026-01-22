import { BookOpen, Target, FolderOpen, Menu, X, BarChart3, Star, Settings } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CompassQuillIcon } from '@/components/icons/CompassQuillIcon';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'diary', label: 'Daily Reflection', icon: BookOpen },
  { id: 'tasks', label: 'Goals & Tasks', icon: Target },
  { id: 'day-to-day', label: 'Day to Day', icon: BookOpen },
  { id: 'bucketlist', label: 'Dreams', icon: Star },
  { id: 'analytics', label: 'Progress', icon: BarChart3 },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
];

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b-2 border-gold/30 shadow-parchment">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <CompassQuillIcon className="w-10 h-10 md:w-12 md:h-12" />
              <div className="absolute inset-0 bg-candlelight/10 blur-xl rounded-full animate-candleflicker" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-display text-xl md:text-2xl font-bold text-burgundy tracking-wide">
                Velomentum
              </h1>
              <span className="hidden md:block text-xs text-muted-foreground italic">
                "Turn your dreams into momentum"
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded transition-all font-body text-lg",
                  activeTab === item.id
                    ? "bg-burgundy text-primary-foreground shadow-gold"
                    : "hover:bg-muted text-foreground hover:text-burgundy"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 px-3 py-2 rounded transition-all font-body text-lg hover:bg-muted text-foreground hover:text-burgundy ml-2"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground hover:text-burgundy transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 rounded transition-all font-body text-lg",
                  activeTab === item.id
                    ? "bg-burgundy text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => {
                navigate('/settings');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded transition-all font-body text-lg hover:bg-muted text-foreground"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </nav>
        )}
      </div>

      {/* Decorative Border */}
      <div className="h-1 w-full ornament opacity-50" />
    </header>
  );
}