import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-medium text-foreground ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              // Layout Base (Igual que Input)
              'flex h-11 w-full appearance-none rounded-xl border px-4 py-2 text-sm transition-all duration-200 cursor-pointer',
              
              // Colores Semánticos (Fondo, Borde, Texto)
              'bg-background/80 border-input text-foreground',
              
              // Hover States
              'hover:bg-accent/10 hover:border-primary/30',
              
              // Focus States
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background',
              
              // Error State
              error 
                ? 'border-destructive focus:ring-destructive/50 text-destructive' 
                : '',
              
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                className="bg-background text-foreground"
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none opacity-70" />
        </div>
        
        {error && (
          <p className="text-[0.8rem] font-medium text-destructive ml-1 animate-in slide-in-from-top-1 fade-in-0">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };