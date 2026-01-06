import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

const QUOTES = [
  // On Goal Setting
  { text: "If you want to live a happy life, tie it to a goal, not to people or things.", author: "Albert Einstein" },
  { text: "Setting goals is the first step in turning the invisible into the visible.", author: "Tony Robbins" },
  { text: "The trouble with not having a goal is that you can spend your life running up and down the field and never score.", author: "Bill Copeland" },
  { text: "All who have accomplished great things have had a great aim, have fixed their gaze on a goal which was high, one which sometimes seemed impossible.", author: "Orison Swett Marden" },
  
  // On Taking Daily Action
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You do not find a happy life. You make it.", author: "Camilla Eyring Kimball" },
  
  // On Dreaming Big (Long-Term Vision)
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Your goals are the road maps that guide you and show you what is possible for your life.", author: "Les Brown" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Dreaming, after all, is a form of planning.", author: "Gloria Steinem" },
  
  // On Consistency & Recording Progress
  { text: "A personal journal is an ideal environment in which to become. It is a perfect place for you to stop, pause, and listen at length.", author: "Sandra Marinella" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
  { text: "Journaling is like whispering to oneself and listening at the same time.", author: "Mina Murray" },
  
  // Additional inspiration
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
  { text: "What you get by achieving your goals is not as important as what you become.", author: "Zig Ziglar" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
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
