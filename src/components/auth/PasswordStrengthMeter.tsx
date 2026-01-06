import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthMeterProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const requirements: Requirement[] = useMemo(() => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains special character (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password]);

  const strength = useMemo(() => {
    const metCount = requirements.filter(r => r.met).length;
    return (metCount / requirements.length) * 100;
  }, [requirements]);

  const strengthLabel = useMemo(() => {
    if (strength === 0) return { text: '', color: '' };
    if (strength <= 20) return { text: 'Very Weak', color: 'text-destructive' };
    if (strength <= 40) return { text: 'Weak', color: 'text-orange-500' };
    if (strength <= 60) return { text: 'Fair', color: 'text-yellow-500' };
    if (strength <= 80) return { text: 'Good', color: 'text-emerald-400' };
    return { text: 'Strong', color: 'text-emerald-500' };
  }, [strength]);

  const progressColor = useMemo(() => {
    if (strength <= 20) return 'bg-destructive';
    if (strength <= 40) return 'bg-orange-500';
    if (strength <= 60) return 'bg-yellow-500';
    if (strength <= 80) return 'bg-emerald-400';
    return 'bg-emerald-500';
  }, [strength]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs font-body">
          <span className="text-muted-foreground">Password strength</span>
          <span className={strengthLabel.color}>{strengthLabel.text}</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>
      
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li 
            key={index} 
            className={`flex items-center gap-2 text-xs font-body transition-colors ${
              req.met ? 'text-emerald-600' : 'text-muted-foreground'
            }`}
          >
            {req.met ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
