import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time in different timezones and find users who should receive notifications
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    console.log(`Running daily reminder check at ${currentHour}:${currentMinute} UTC`);

    // Get all notification preferences where daily reminder is enabled
    const { data: preferences, error: prefError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("daily_reminder_enabled", true);

    if (prefError) {
      console.error("Error fetching preferences:", prefError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch preferences" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!preferences || preferences.length === 0) {
      console.log("No users with daily reminders enabled");
      return new Response(
        JSON.stringify({ success: true, message: "No reminders to send" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;

    for (const pref of preferences) {
      // Parse the reminder time
      const [reminderHour, reminderMinute] = pref.daily_reminder_time.split(':').map(Number);
      
      // Get timezone offset for the user's timezone
      // For simplicity, we'll check if the current UTC time matches their local time
      const timezoneOffsets: Record<string, number> = {
        'Europe/London': 0, // GMT (ignoring DST for simplicity)
        'Europe/Paris': 1,
        'Europe/Berlin': 1,
        'America/New_York': -5,
        'America/Los_Angeles': -8,
        'Asia/Tokyo': 9,
        'Australia/Sydney': 10,
      };

      const offset = timezoneOffsets[pref.timezone] ?? 0;
      const userLocalHour = (currentHour + offset + 24) % 24;
      
      // Check if it's time to send the notification (within 5 minute window)
      const isTimeToSend = userLocalHour === reminderHour && 
                           currentMinute >= reminderMinute && 
                           currentMinute < reminderMinute + 5;

      if (isTimeToSend) {
        console.log(`Sending reminder to user ${pref.user_id}`);
        
        // Call the send-push-notification function
        const { error: sendError } = await supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: pref.user_id,
            title: "Daily Reminder",
            body: pref.daily_reminder_message,
            type: "daily_reminder",
            url: "/",
          },
        });

        if (sendError) {
          console.error(`Error sending to user ${pref.user_id}:`, sendError);
        } else {
          sentCount++;
        }
      }
    }

    console.log(`Daily reminder check complete. Sent ${sentCount} notifications.`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in daily-reminder:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
