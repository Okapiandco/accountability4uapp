import { Bell, BellOff, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription className="font-body">
          Get reminders for tasks, goals, and diary entries.
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
            onCheckedChange={handleToggle}
            disabled={isLoading || permission === 'denied'}
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
  );
}
