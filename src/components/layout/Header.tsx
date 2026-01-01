import { Feather, BookOpen, Target, FolderOpen, Menu, X, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'diary', label: 'Daily Chronicle', icon: BookOpen },
  { id: 'tasks', label: 'Quests & Endeavours', icon: Target },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'projects', label: 'Archives', icon: FolderOpen },
];

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b-2 border-gold/30 shadow-parchment">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Feather className="w-8 h-8 md:w-10 md:h-10 text-gold animate-quill-write" />
              <div className="absolute inset-0 bg-candlelight/20 blur-xl rounded-full animate-candleflicker" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-display text-xl md:text-2xl font-bold text-burgundy tracking-wide">
                The Chronicler
              </h1>
              <span className="hidden md:block text-xs text-muted-foreground italic">
                "All the world's a stage, and all the days merely entries"
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
          </nav>
        )}
      </div>

      {/* Decorative Border */}
      <div className="h-1 w-full ornament opacity-50" />
    </header>
  );
}