import { useState, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface DiaryEntry {
  id: string;
  date: string;
  content: string | null;
  audio_transcript: string | null;
}

interface DiaryCalendarProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

export function DiaryCalendar({ onSelectDate, selectedDate }: DiaryCalendarProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchEntries = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('diary_entries')
        .select('id, date, content, audio_transcript')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
      } else {
        setEntries(data || []);
      }
      setIsLoading(false);
    };

    fetchEntries();
  }, [user]);

  // Get dates that have entries
  const entryDates = entries.map(e => new Date(e.date + 'T00:00:00'));

  // Get selected entry preview
  const selectedEntry = entries.find(
    e => e.date === format(selectedDate, 'yyyy-MM-dd')
  );

  const modifiers = {
    hasEntry: entryDates,
  };

  const modifiersClassNames = {
    hasEntry: 'bg-gold/30 text-gold-dark font-bold',
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
      {/* Calendar */}
      <Card className="bg-card border-2 border-gold/20 shadow-parchment">
        <CardHeader className="pb-2">
          <h3 className="font-display text-lg text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-burgundy" />
            Chronicle Archive
          </h3>
          <p className="text-sm text-muted-foreground font-body italic">
            Select a date to view or write an entry
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onSelectDate(date)}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className={cn("p-3 pointer-events-auto")}
              disabled={(date) => date > new Date()}
            />
          )}
        </CardContent>
      </Card>

      {/* Entry Preview / Stats */}
      <Card className="bg-card border-2 border-gold/20 shadow-parchment">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-foreground">
              {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            {selectedEntry && (
              <Badge variant="secondary" className="bg-gold/20 text-gold-dark">
                Entry exists
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedEntry ? (
            <ScrollArea className="h-[250px]">
              <div className="space-y-4">
                {selectedEntry.content && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 font-body">Content:</p>
                    <p className="font-body text-foreground whitespace-pre-wrap line-clamp-6">
                      {selectedEntry.content}
                    </p>
                  </div>
                )}
                {selectedEntry.audio_transcript && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 font-body">Voice Notes:</p>
                    <p className="font-body text-foreground/80 italic whitespace-pre-wrap line-clamp-4">
                      {selectedEntry.audio_transcript}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-[250px] flex flex-col items-center justify-center text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-body text-muted-foreground">
                No entry for this date
              </p>
              <p className="font-body text-sm text-muted-foreground/70 mt-1">
                Click "Write Entry" to create one
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Card className="md:col-span-2 bg-card border-2 border-gold/20 shadow-parchment">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-center">
            <div>
              <p className="font-display text-3xl text-burgundy">{entries.length}</p>
              <p className="text-sm text-muted-foreground font-body">Total Entries</p>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div>
              <p className="font-display text-3xl text-gold">
                {entries.reduce((acc, e) => acc + (e.content?.length || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground font-body">Characters Written</p>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div>
              <p className="font-display text-3xl text-burgundy">
                {entries.filter(e => e.audio_transcript).length}
              </p>
              <p className="text-sm text-muted-foreground font-body">Voice Entries</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
