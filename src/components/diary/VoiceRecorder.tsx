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
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        }
      });
      streamRef.current = stream;
      console.log('Got media stream');

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

      // Set up media recorder to capture audio
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      console.log('Using MIME type:', mimeType);
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        await processAudio();
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
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
      console.log('Stopping recording...');
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

  const processAudio = async () => {
    if (chunksRef.current.length === 0) {
      console.log('No audio chunks recorded');
      toast({
        title: "No audio recorded",
        description: "Please try again and speak into the microphone.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    toast({
      title: "Processing thy words...",
      description: "The scribe is at work transcribing thy speech.",
    });

    try {
      const audioBlob = new Blob(chunksRef.current, { type: chunksRef.current[0].type });
      console.log('Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type);

      if (audioBlob.size < 1000) {
        toast({
          title: "Recording too short",
          description: "Please speak for a bit longer.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Create FormData and send to edge function
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      console.log('Sending audio to transcription service...');

      // Get the Supabase URL and key for the fetch request
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transcription API error:', response.status, errorText);
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Transcription response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.text || data.text.trim() === '') {
        toast({
          title: "No speech detected",
          description: "Speak up! Try again or check your microphone.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      onTranscript(data.text);
      toast({
        title: "Chronicle inscribed!",
        description: "Thy words have been transcribed with care.",
      });

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Transcription failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      chunksRef.current = [];
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
