import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Use APP_ORIGIN env variable for CORS, with fallback for development
const allowedOrigin = Deno.env.get('APP_ORIGIN') || '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    
    if (!audioFile) {
      throw new Error('No audio file provided');
    }

    console.log('Received audio file:', audioFile.name, 'size:', audioFile.size, 'type:', audioFile.type);

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // Use ElevenLabs Scribe for transcription
    const apiFormData = new FormData();
    apiFormData.append("file", audioFile);
    apiFormData.append("model_id", "scribe_v1");
    apiFormData.append("language_code", "eng");

    console.log('Sending to ElevenLabs Scribe API...');

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const transcription = await response.json();
    console.log('Transcription result:', transcription);

    return new Response(
      JSON.stringify({ text: transcription.text || '' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log detailed error for server-side debugging
    console.error('Transcription error:', error);
    
    // Return generic error message to client
    return new Response(
      JSON.stringify({ error: 'Transcription failed. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
