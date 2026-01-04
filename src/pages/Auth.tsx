import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Feather, Mail, Lock } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast({
          title: "Check thy inbox!",
          description: "A password reset link has been sent to thy email.",
        });
        setIsForgotPassword(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "Thy return is most welcome, chronicler.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Welcome to thy new chronicle.",
        });
      }
    } catch (error: any) {
      let message = error.message;
      if (error.message.includes('User already registered')) {
        message = 'This email is already registered. Please sign in instead.';
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background parchment-texture flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-2 border-gold/20 shadow-parchment">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-gold/20 to-burgundy/20">
              <Feather className="w-8 h-8 text-gold" />
            </div>
          </div>
          <CardTitle className="font-display text-2xl text-burgundy">
            {isForgotPassword 
              ? 'Reset Thy Password' 
              : isLogin 
                ? 'Welcome Back, Chronicler' 
                : 'Begin Thy Chronicle'}
          </CardTitle>
          <CardDescription className="font-body italic text-muted-foreground">
            {isForgotPassword
              ? '"A new chapter awaits"'
              : isLogin 
                ? '"What is past is prologue"' 
                : '"The pen is mightier than the sword"'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="chronicler@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-parchment/50 border-border focus:border-gold"
                  required
                />
              </div>
            </div>
            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="font-body">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-parchment/50 border-border focus:border-gold"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}
            {isLogin && !isForgotPassword && (
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-burgundy font-body"
              >
                Forgot thy password?
              </button>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-burgundy to-burgundy-light hover:shadow-gold"
              disabled={loading}
            >
              {loading 
                ? 'Please wait...' 
                : isForgotPassword 
                  ? 'Send Reset Link' 
                  : isLogin 
                    ? 'Enter Thy Chronicle' 
                    : 'Create Thy Chronicle'}
            </Button>
          </form>
          <div className="mt-6 text-center space-y-2">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-sm text-muted-foreground hover:text-burgundy font-body"
              >
                Back to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-burgundy font-body"
              >
                {isLogin 
                  ? "New chronicler? Create an account" 
                  : "Already have an account? Sign in"}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
