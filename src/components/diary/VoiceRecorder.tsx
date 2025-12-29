import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';


interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  isProcessing?: boolean;
}

export function VoiceRecorder({ onTranscript, isProcessing: externalProcessing }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const { toast } = useToast();

  // Check for Web Speech API support
  const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const hasSpeechRecognition = !!SpeechRecognitionAPI;

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255);
        }
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // Set up Web Speech API for real-time transcription
      if (hasSpeechRecognition) {
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        transcriptRef.current = '';
        
        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            transcriptRef.current += finalTranscript;
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error !== 'no-speech') {
            toast({
              title: "Speech recognition error",
              description: `Error: ${event.error}`,
              variant: "destructive",
            });
          }
        };

        recognitionRef.current.start();
      }

      // Set up media recorder as backup
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        processTranscription();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Recording hath begun",
        description: "Speak thy thoughts, and they shall be transcribed...",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Alas! Microphone access denied",
        description: "Prithee grant permission to use thy microphone.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const processTranscription = async () => {
    setIsProcessing(true);
    
    toast({
      title: "Processing thy words...",
      description: "The scribe is at work transcribing thy speech.",
    });

    try {
      // Use the transcript from Web Speech API
      const rawTranscript = transcriptRef.current.trim();
      
      if (!rawTranscript) {
        toast({
          title: "No speech detected",
          description: "Speak louder or try again, good chronicler.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Enhance the transcript using AI
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { 
          audio: rawTranscript,
          rawText: rawTranscript 
        }
      });

      if (error) {
        console.error('Transcription error:', error);
        // Fallback to raw transcript if AI enhancement fails
        onTranscript(rawTranscript);
        toast({
          title: "Words captured!",
          description: "Thy speech hath been recorded.",
        });
      } else {
        // Use AI-enhanced text or fall back to raw
        const finalText = data?.text || rawTranscript;
        onTranscript(finalText);
        toast({
          title: "Chronicle inscribed!",
          description: "Thy words have been transcribed with care.",
        });
      }
    } catch (error) {
      console.error('Processing error:', error);
      // Fallback to raw transcript
      if (transcriptRef.current.trim()) {
        onTranscript(transcriptRef.current.trim());
      }
      toast({
        title: "Partial transcription",
        description: "Some words were captured, though the scribe struggled.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processing = isProcessing || externalProcessing;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Recording Button with Glow Effect */}
      <div className="relative">
        {/* Animated glow ring */}
        {isRecording && (
          <div 
            className="absolute inset-0 rounded-full bg-burgundy/30 animate-ping"
            style={{ transform: `scale(${1 + audioLevel * 0.5})` }}
          />
        )}
        
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={processing}
          className={cn(
            "relative w-20 h-20 rounded-full transition-all duration-300 shadow-lg",
            isRecording 
              ? "bg-destructive hover:bg-destructive/90 shadow-[0_0_30px_hsl(var(--destructive)/0.5)]" 
              : "bg-gradient-to-br from-burgundy to-burgundy-light hover:shadow-gold"
          )}
        >
          {processing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isRecording ? (
            <Square className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>
      </div>

      {/* Status Text */}
      <p className="font-body text-lg text-muted-foreground italic text-center">
        {processing 
          ? "The scribe transcribes thy words..."
          : isRecording 
            ? "Speak now, thy words are being captured..."
            : "Touch the quill to begin thy chronicle"
        }
      </p>

      {/* Speech Recognition Support Notice */}
      {!hasSpeechRecognition && (
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          For best results, use Chrome or Edge browser for voice transcription.
        </p>
      )}

      {/* Audio Level Visualization */}
      {isRecording && (
        <div className="flex items-center gap-1 h-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-gradient-to-t from-burgundy to-gold rounded-full transition-all duration-75"
              style={{
                height: `${Math.max(8, Math.min(32, audioLevel * 100 + Math.random() * 10))}px`,
                opacity: audioLevel > 0.1 ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
