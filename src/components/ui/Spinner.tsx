import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={cn(
        // Base: Color de pista suave (muted) y color principal vibrante (primary)
        'animate-spin rounded-full border-muted border-t-primary',
        sizes[size],
        className
      )}
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Cargando...' }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md z-50 transition-all duration-300">
      <Spinner size="lg" />
      <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Spinner size="lg" />
      <p className="mt-4 text-sm font-medium text-muted-foreground">Cargando contenido...</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    // Skeleton adaptativo: Se ve como un bloque gris suave en ambos modos
    <div className="rounded-2xl border border-border/50 p-6 bg-card/50 shadow-sm">
      <div className="animate-pulse space-y-4">
        {/* Título simulado */}
        <div className="h-5 bg-muted rounded-md w-1/3" />
        
        {/* Contenido principal simulado */}
        <div className="h-8 bg-muted rounded-md w-3/4" />
        
        {/* Subtítulo simulado */}
        <div className="h-4 bg-muted/60 rounded-md w-1/2" />
      </div>
    </div>
  );
}