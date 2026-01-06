import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { CompassQuillIcon } from '@/components/icons/CompassQuillIcon';
import { Separator } from '@/components/ui/separator';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isPasswordUpdate, setIsPasswordUpdate] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isPasswordStrong = useMemo(() => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
  }, [password]);

  const showPasswordStrength = (!isLogin || isPasswordUpdate) && !isForgotPassword;

  useEffect(() => {
    // Check for password recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordUpdate(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !isPasswordUpdate) {
      navigate('/');
    }
  }, [user, navigate, isPasswordUpdate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isPasswordUpdate) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (!isPasswordStrong) {
          throw new Error('Password does not meet strength requirements');
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast({
          title: "Password updated!",
          description: "Thy password has been changed successfully.",
        });
        setIsPasswordUpdate(false);
        setPassword('');
        setConfirmPassword('');
        navigate('/');
      } else if (isForgotPassword) {
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
        if (!isPasswordStrong) {
          throw new Error('Password does not meet strength requirements');
        }
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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const getTitle = () => {
    if (isPasswordUpdate) return 'Update Thy Password';
    if (isForgotPassword) return 'Reset Thy Password';
    return isLogin ? 'Welcome Back, Chronicler' : 'Begin Thy Chronicle';
  };

  const getDescription = () => {
    if (isPasswordUpdate) return '"A fresh start awaits"';
    if (isForgotPassword) return '"A new chapter awaits"';
    return isLogin ? '"What is past is prologue"' : '"The pen is mightier than the sword"';
  };

  const getButtonText = () => {
    if (loading) return 'Please wait...';
    if (isPasswordUpdate) return 'Update Password';
    if (isForgotPassword) return 'Send Reset Link';
    return isLogin ? 'Enter Thy Chronicle' : 'Create Thy Chronicle';
  };

  return (
    <div className="min-h-screen bg-background parchment-texture flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-2 border-gold/20 shadow-parchment">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <CompassQuillIcon className="w-16 h-16" />
          </div>
          <CardTitle className="font-display text-2xl text-burgundy">
            {getTitle()}
          </CardTitle>
          <CardDescription className="font-body italic text-muted-foreground">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isPasswordUpdate && (
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
            )}
            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="font-body">
                  {isPasswordUpdate ? 'New Password' : 'Password'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-parchment/50 border-border focus:border-gold"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {showPasswordStrength && (
                  <PasswordStrengthMeter password={password} />
                )}
              </div>
            )}
            {isPasswordUpdate && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-body">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 bg-parchment/50 border-border focus:border-gold"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
            {isLogin && !isForgotPassword && !isPasswordUpdate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-burgundy focus:ring-gold cursor-pointer"
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-body text-muted-foreground cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-burgundy font-body"
                >
                  Forgot thy password?
                </button>
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-burgundy to-burgundy-light hover:shadow-gold transition-all"
              disabled={loading}
            >
              {getButtonText()}
            </Button>

            {!isForgotPassword && !isPasswordUpdate && (
              <>
                <div className="relative my-6">
                  <Separator className="bg-border" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground font-body">
                    or continue with
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border hover:border-gold hover:bg-parchment/50 transition-all"
                  onClick={handleGoogleLogin}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </>
            )}
          </form>
          {!isPasswordUpdate && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
