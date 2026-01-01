import { useState, useRef, useEffect, useCallback } from 'react';
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
  const isRecordingRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [interimText, setInterimText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>('');
  const { toast } = useToast();

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Check for Web Speech API support
  const getSpeechRecognition = useCallback(() => {
    return window.SpeechRecognition || window.webkitSpeechRecognition;
  }, []);

  const hasSpeechRecognition = !!getSpeechRecognition();

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      console.log('Speech Recognition available:', hasSpeechRecognition);

      // Mark recording immediately so SpeechRecognition onend can restart reliably
      setIsRecording(true);
      isRecordingRef.current = true;
      transcriptRef.current = '';
      setInterimText('');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

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
      const SpeechRecognitionAPI = getSpeechRecognition();
      if (SpeechRecognitionAPI) {
        console.log('Initializing Speech Recognition...');
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
        };

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          console.log('Speech recognition result received', event.results.length);
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
              console.log('Final transcript:', transcript);
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            transcriptRef.current += finalTranscript;
          }
          setInterimText(interimTranscript);
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error, event.message);
          if (event.error === 'not-allowed') {
            toast({
              title: "Microphone access denied",
              description: "Please allow microphone access in your browser settings.",
              variant: "destructive",
            });
          } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
            toast({
              title: "Speech recognition error",
              description: `Error: ${event.error}`,
              variant: "destructive",
            });
          }
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended, isRecordingRef:', isRecordingRef.current);
          if (isRecordingRef.current && recognitionRef.current) {
            try {
              console.log('Restarting speech recognition...');
              recognitionRef.current.start();
            } catch (e) {
              console.log('Could not restart recognition:', e);
            }
          }
        };

        try {
          recognitionRef.current.start();
          console.log('Speech recognition start() called');
        } catch (e) {
          console.error('Failed to start speech recognition:', e);
        }
      } else {
        console.warn('Web Speech API not supported');
        toast({
          title: "Speech recognition not supported",
          description: "Please use Chrome or Edge for voice transcription.",
          variant: "destructive",
        });
      }

      // Set up media recorder (for future audio storage if needed)
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        processTranscription();
      };

      mediaRecorderRef.current.start();

      toast({
        title: "Recording hath begun",
        description: "Speak thy thoughts, and they shall be transcribed...",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
      isRecordingRef.current = false;
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
      isRecordingRef.current = false;
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

      {/* Real-time transcript preview */}
      {isRecording && (interimText || transcriptRef.current) && (
        <div className="max-w-md p-3 bg-muted/50 rounded-lg border border-border/50">
          <p className="font-body text-sm text-foreground">
            {transcriptRef.current}
            <span className="text-muted-foreground italic">{interimText}</span>
          </p>
        </div>
      )}

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
