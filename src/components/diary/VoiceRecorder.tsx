import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  isProcessing?: boolean;
}

export function VoiceRecorder({ onTranscript, isProcessing }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
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

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        processAudio(blob);
        stream.getTracks().forEach(track => track.stop());
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
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const processAudio = async (blob: Blob) => {
    // For now, simulate transcription - will be enhanced with Lovable Cloud
    toast({
      title: "Processing thy words...",
      description: "The scribe is at work transcribing thy speech.",
    });

    // Simulate processing delay
    setTimeout(() => {
      const simulatedText = "Here be the transcription of thy spoken words. Connect to Lovable Cloud to enable true voice transcription with AI.";
      onTranscript(simulatedText);
    }, 1500);
  };

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
          disabled={isProcessing}
          className={cn(
            "relative w-20 h-20 rounded-full transition-all duration-300 shadow-lg",
            isRecording 
              ? "bg-destructive hover:bg-destructive/90 shadow-[0_0_30px_hsl(var(--destructive)/0.5)]" 
              : "bg-gradient-to-br from-burgundy to-burgundy-light hover:shadow-gold"
          )}
        >
          {isProcessing ? (
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
        {isProcessing 
          ? "The scribe transcribes thy words..."
          : isRecording 
            ? "Speak now, thy words are being captured..."
            : "Touch the quill to begin thy chronicle"
        }
      </p>

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