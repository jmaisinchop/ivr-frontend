import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export function Card({ children, className, hover = false, gradient = false }: CardProps) {
  return (
    <div
      className={cn(
        // Base: Bordes suaves, redondeado iOS (2xl), efecto cristal base
        'rounded-2xl border border-border/40 backdrop-blur-xl transition-all duration-300',
        
        // Estilo por defecto (Flat/Glass) - Se adapta a bg-card (Blanco/Negro)
        !gradient && 'bg-card/70 shadow-sm',
        
        // Estilo Gradiente (Sutil) - Ajustado para no ser agresivo en modo claro
        gradient && 'bg-gradient-to-br from-card/90 via-card/50 to-background/50',
        
        // Efecto Hover: Elevación estilo iOS y sombra difusa
        hover && 'hover:shadow-lg hover:-translate-y-0.5 hover:bg-card/90 hover:border-border/80 cursor-pointer',
        
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn(
      'px-6 py-4 border-b border-border/40 flex flex-col space-y-1.5', 
      className
    )}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('p-6 pt-4', className)}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn(
      'px-6 py-4 border-t border-border/40 flex items-center bg-muted/20', 
      className
    )}>
      {children}
    </div>
  );
}