import { useState, useEffect } from 'react';
import { Bell, BellOff, TestTube, Clock, MessageSquare, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface NotificationPreferences {
  id?: string;
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  daily_reminder_message: string;
  timezone: string;
}

const TIMEZONES = [
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

export function NotificationSettings() {
  const { user } = useAuth();
  const {
    isSupported,
    isSubscribed,
    isLoading: pushLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    daily_reminder_enabled: true,
    daily_reminder_time: '18:00',
    daily_reminder_message: 'Have you achieved your daily task today?',
    timezone: 'Europe/London',
  });
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user's notification preferences
  useEffect(() => {
    async function fetchPreferences() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching preferences:', error);
          return;
        }

        if (data) {
          setPreferences({
            id: data.id,
            daily_reminder_enabled: data.daily_reminder_enabled,
            daily_reminder_time: data.daily_reminder_time.substring(0, 5), // Format HH:MM
            daily_reminder_message: data.daily_reminder_message,
            timezone: data.timezone,
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoadingPrefs(false);
      }
    }

    fetchPreferences();
  }, [user]);

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const savePreferences = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const prefData = {
        user_id: user.id,
        daily_reminder_enabled: preferences.daily_reminder_enabled,
        daily_reminder_time: preferences.daily_reminder_time + ':00',
        daily_reminder_message: preferences.daily_reminder_message,
        timezone: preferences.timezone,
      };

      const { error } = await supabase
        .from('notification_preferences')
        .upsert(prefData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving preferences:', error);
        toast.error('Failed to save preferences');
      } else {
        toast.success('Preferences saved!');
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <BellOff className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription className="font-body">
            Push notifications are not supported in your browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Push Notification Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription className="font-body">
            Enable notifications to receive daily reminders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="flex flex-col gap-1">
              <span className="font-body">Enable notifications</span>
              <span className="text-sm text-muted-foreground font-body">
                {permission === 'denied' 
                  ? 'Blocked in browser settings' 
                  : isSubscribed 
                    ? 'Receiving push notifications' 
                    : 'Not receiving notifications'}
              </span>
            </Label>
            <Switch
              id="notifications"
              checked={isSubscribed}
              onCheckedChange={handlePushToggle}
              disabled={pushLoading || permission === 'denied'}
            />
          </div>

          {isSubscribed && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={sendTestNotification}
              className="w-full"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Send Test Notification
            </Button>
          )}

          {permission === 'denied' && (
            <p className="text-sm text-destructive font-body">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Daily Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Clock className="h-5 w-5" />
            Daily Reminder
          </CardTitle>
          <CardDescription className="font-body">
            Get a daily reminder to reflect on your achievements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingPrefs ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="daily-reminder" className="font-body">
                  Enable daily reminder
                </Label>
                <Switch
                  id="daily-reminder"
                  checked={preferences.daily_reminder_enabled}
                  onCheckedChange={(checked) => updatePreference('daily_reminder_enabled', checked)}
                />
              </div>

              {preferences.daily_reminder_enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reminder-time" className="font-body flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Reminder time
                    </Label>
                    <Input
                      id="reminder-time"
                      type="time"
                      value={preferences.daily_reminder_time}
                      onChange={(e) => updatePreference('daily_reminder_time', e.target.value)}
                      className="max-w-[150px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="font-body">
                      Timezone
                    </Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) => updatePreference('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reminder-message" className="font-body flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Custom message
                    </Label>
                    <Textarea
                      id="reminder-message"
                      value={preferences.daily_reminder_message}
                      onChange={(e) => updatePreference('daily_reminder_message', e.target.value)}
                      placeholder="Enter your custom reminder message..."
                      className="resize-none"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground font-body">
                      This message will be shown in your daily notification.
                    </p>
                  </div>
                </>
              )}

              {hasChanges && (
                <Button 
                  onClick={savePreferences} 
                  disabled={isSaving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
