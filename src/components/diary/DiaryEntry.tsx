import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Save, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VoiceRecorder } from './VoiceRecorder';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface DiaryEntryProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function DiaryEntry({ date, onDateChange }: DiaryEntryProps) {
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleTranscript = (text: string) => {
    setContent(prev => prev + (prev ? '\n\n' : '') + text);
    setIsProcessing(false);
  };

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

  const handleSave = () => {
    // Will save to database with Lovable Cloud
    toast({
      title: "Entry preserved!",
      description: "Thy chronicle hath been safely stored.",
    });
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

      {/* Voice Recorder */}
      <Card className="bg-card border-2 border-gold/20 shadow-parchment">
        <CardHeader className="text-center pb-2">
          <h3 className="font-display text-lg text-foreground">
            Speak Thy Mind
          </h3>
          <p className="text-sm text-muted-foreground font-body italic">
            "Give every thought a tongue, every tongue its freedom"
          </p>
        </CardHeader>
        <CardContent>
          <VoiceRecorder 
            onTranscript={handleTranscript}
            isProcessing={isProcessing}
          />
        </CardContent>
      </Card>

      {/* Entry Content */}
      <Card className="bg-card border-2 border-gold/20 shadow-parchment">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-foreground">
              This Day's Chronicle
            </h3>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-burgundy to-burgundy-light hover:shadow-gold"
            >
              <Save className="w-4 h-4 mr-2" />
              Preserve
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What hath transpired this day? Record thy thoughts, deeds, and musings herein..."
            className="min-h-[300px] font-body text-lg leading-relaxed bg-parchment/50 border-border focus:border-gold focus:ring-gold/20 resize-none"
          />
          <p className="mt-2 text-sm text-muted-foreground text-right">
            {content.length} characters inscribed
          </p>
        </CardContent>
      </Card>

      {/* Decorative Ornament */}
      <div className="h-8 ornament opacity-30" />
    </div>
  );
}