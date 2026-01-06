import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Save, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TomorrowGoal } from './TomorrowGoal';
import { MotivationalQuote } from '@/components/ui/MotivationalQuote';
interface DiaryEntryProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function DiaryEntry({ date, onDateChange }: DiaryEntryProps) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const dateString = format(date, 'yyyy-MM-dd');

  // Fetch existing entry for this date
  const fetchEntry = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateString)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setContent(data.content || '');
        setEntryId(data.id);
      } else {
        setContent('');
        setEntryId(null);
      }
    } catch (error: any) {
      console.error('Error fetching entry:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, dateString]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const handlePreviousDay = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + 1);
    onDateChange(newDate);
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not authenticated",
        description: "Please sign in to save entries.",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (entryId) {
        // Update existing entry
        const { error } = await supabase
          .from('diary_entries')
          .update({
            content,
          })
          .eq('id', entryId);

        if (error) throw error;
      } else {
        // Insert new entry
        const { data, error } = await supabase
          .from('diary_entries')
          .insert({
            user_id: user.id,
            date: dateString,
            content,
          })
          .select()
          .single();

        if (error) throw error;
        setEntryId(data.id);
      }
      toast({
        title: "Entry preserved!",
        description: "Thy chronicle hath been safely stored.",
      });
    } catch (error: any) {
      console.error('Error saving entry:', error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = format(date, "EEEE, do 'of' MMMM, yyyy");
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePreviousDay}
          className="hover:bg-muted hover:text-burgundy"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span className="hidden sm:inline">Previous Day</span>
        </Button>

        <div className="flex items-center gap-2 text-center">
          <CalendarDays className="w-5 h-5 text-gold" />
          <h2 className="font-display text-xl md:text-2xl text-burgundy">
            {formattedDate}
          </h2>
          {isToday && (
            <span className="px-2 py-0.5 bg-gold/20 text-gold-light text-sm rounded font-body">
              Today
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={handleNextDay}
          className="hover:bg-muted hover:text-burgundy"
        >
          <span className="hidden sm:inline">Next Day</span>
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>

      {/* Motivational Quote */}
      <MotivationalQuote variant="card" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Entry Content */}
        <Card className="bg-card border-2 border-gold/20 shadow-parchment lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-foreground">
                This Day's Chronicle
              </h3>
              <Button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="bg-gradient-to-r from-burgundy to-burgundy-light hover:shadow-gold"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Preserve'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What hath transpired this day? Record thy thoughts, deeds, and musings herein..."
                className="min-h-[300px] font-body text-lg leading-relaxed bg-parchment/50 border-border focus:border-gold focus:ring-gold/20 resize-none"
              />
            )}
            <p className="mt-2 text-sm text-muted-foreground text-right">
              {content.length} characters inscribed
            </p>
          </CardContent>
        </Card>

        {/* Tomorrow's Goal Sidebar */}
        <div className="space-y-6">
          <TomorrowGoal date={date} />
          
          <div className="p-4 bg-parchment/30 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground text-center italic">
              "The only way to do great work is to love what you do." — Steve Jobs
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Ornament */}
      <div className="h-8 ornament opacity-30" />
    </div>
  );
}
