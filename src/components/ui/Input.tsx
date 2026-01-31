import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-medium text-foreground ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={type}
            className={cn(
              // Layout & Base
              'flex h-11 w-full rounded-xl border px-4 py-2 text-sm transition-all duration-200',
              
              // Colores (Light/Dark Mode automáticos)
              // Fondo sutilmente transparente para mezclarse con glassmorphism si es necesario
              'bg-background/80 border-input text-foreground placeholder:text-muted-foreground',
              
              // Hover States
              'hover:bg-accent/10 hover:border-primary/30',
              
              // Focus States (Anillo estilo iOS)
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background',
              
              // File Inputs
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              
              // Error State
              error 
                ? 'border-destructive focus:ring-destructive/50 text-destructive placeholder:text-destructive/50' 
                : '',
              
              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-50',
              
              className
            )}
            {...props}
          />
        </div>
        
        {error && (
          <p className="text-[0.8rem] font-medium text-destructive ml-1 animate-in slide-in-from-top-1 fade-in-0">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="text-[0.8rem] text-muted-foreground ml-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };