import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-medium text-foreground ml-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            // Base Layout
            'flex min-h-[80px] w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 resize-none',
            
            // Colors (Light/Dark Auto)
            'bg-background/80 border-input text-foreground placeholder:text-muted-foreground',
            
            // Hover States
            'hover:bg-accent/10 hover:border-primary/30',
            
            // Focus States
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background',
            
            // Error State
            error 
              ? 'border-destructive focus:ring-destructive/50 text-destructive placeholder:text-destructive/50' 
              : '',
            
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-[0.8rem] font-medium text-destructive ml-1 animate-in slide-in-from-top-1 fade-in-0">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };