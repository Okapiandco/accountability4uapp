import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

const QUOTES = [
  { text: "Setting goals is the first step in turning the invisible into the visible.", author: "Tony Robbins" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Success is the progressive realization of a worthy goal.", author: "Earl Nightingale" },
  { text: "What you get by achieving your goals is not as important as what you become.", author: "Zig Ziglar" },
  { text: "People with goals succeed because they know where they're going.", author: "Earl Nightingale" },
  { text: "Our goals can only be reached through the vehicle of a plan.", author: "Pablo Picasso" },
  { text: "The only limit to the height of your achievements is the reach of your dreams.", author: "Michelle Obama" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "Write it down. Written goals have a way of transforming wishes into wants.", author: "Brian Tracy" },
];

interface MotivationalQuoteProps {
  variant?: 'default' | 'subtle' | 'card';
  className?: string;
}

export function MotivationalQuote({ variant = 'default', className = '' }: MotivationalQuoteProps) {
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    // Pick a random quote on mount
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[randomIndex]);
  }, []);

  if (variant === 'subtle') {
    return (
      <p className={`text-sm text-muted-foreground italic ${className}`}>
        "{quote.text}"
      </p>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-4 bg-gradient-to-br from-burgundy/5 to-gold/5 rounded-lg border border-gold/20 ${className}`}>
        <div className="flex gap-3">
          <Quote className="w-5 h-5 text-gold shrink-0 mt-1" />
          <div>
            <p className="font-body text-foreground italic">"{quote.text}"</p>
            <p className="text-sm text-muted-foreground mt-2">— {quote.author}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <Quote className="w-6 h-6 text-gold mx-auto mb-2" />
      <p className="font-body text-foreground italic max-w-md mx-auto">"{quote.text}"</p>
      <p className="text-sm text-muted-foreground mt-2">— {quote.author}</p>
    </div>
  );
}
