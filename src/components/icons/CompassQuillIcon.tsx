import { cn } from "@/lib/utils";

interface CompassQuillIconProps {
  className?: string;
}

export const CompassQuillIcon = ({ className }: CompassQuillIconProps) => {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("w-12 h-12", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer compass ring */}
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke="currentColor"
        strokeWidth="2"
        className="text-burgundy"
        fill="none"
      />
      
      {/* Inner compass ring */}
      <circle
        cx="32"
        cy="32"
        r="24"
        stroke="currentColor"
        strokeWidth="1"
        className="text-burgundy/50"
        fill="none"
      />
      
      {/* Compass cardinal points */}
      <line x1="32" y1="6" x2="32" y2="10" stroke="currentColor" strokeWidth="2" className="text-gold" />
      <line x1="32" y1="54" x2="32" y2="58" stroke="currentColor" strokeWidth="2" className="text-gold" />
      <line x1="6" y1="32" x2="10" y2="32" stroke="currentColor" strokeWidth="2" className="text-gold" />
      <line x1="54" y1="32" x2="58" y2="32" stroke="currentColor" strokeWidth="2" className="text-gold" />
      
      {/* Diagonal markers */}
      <line x1="12" y1="12" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" className="text-gold/60" />
      <line x1="49" y1="49" x2="52" y2="52" stroke="currentColor" strokeWidth="1.5" className="text-gold/60" />
      <line x1="52" y1="12" x2="49" y2="15" stroke="currentColor" strokeWidth="1.5" className="text-gold/60" />
      <line x1="15" y1="49" x2="12" y2="52" stroke="currentColor" strokeWidth="1.5" className="text-gold/60" />
      
      {/* Compass needle pointing NE (like in the logo) */}
      <path
        d="M32 32 L44 20"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-burgundy"
      />
      <polygon
        points="44,20 41,26 47,23"
        fill="currentColor"
        className="text-burgundy"
      />
      
      {/* Quill feather integrated as second needle */}
      <path
        d="M32 32 C28 36, 22 40, 18 46"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-gold"
      />
      <path
        d="M18 46 C20 44, 22 42, 24 41 C22 43, 20 45, 18 46 C19 44, 21 43, 23 42"
        stroke="currentColor"
        strokeWidth="1"
        className="text-gold/70"
      />
      
      {/* Feather barbs */}
      <path
        d="M22 42 C20 41, 18 40, 16 42"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        className="text-gold/60"
      />
      <path
        d="M24 40 C22 38, 20 37, 17 38"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        className="text-gold/60"
      />
      
      {/* Center pivot */}
      <circle
        cx="32"
        cy="32"
        r="3"
        fill="currentColor"
        className="text-burgundy"
      />
      <circle
        cx="32"
        cy="32"
        r="1.5"
        fill="currentColor"
        className="text-gold"
      />
      
      {/* Small gear accent (like in the logo) */}
      <circle
        cx="24"
        cy="50"
        r="4"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        className="text-burgundy/40"
      />
      <circle
        cx="24"
        cy="50"
        r="1.5"
        fill="currentColor"
        className="text-burgundy/40"
      />
    </svg>
  );
};
