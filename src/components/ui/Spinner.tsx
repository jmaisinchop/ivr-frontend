import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-dark-600 border-t-primary-500',
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
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900/80 backdrop-blur-sm z-50">
      <Spinner size="lg" />
      <p className="mt-4 text-dark-300">{message}</p>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Spinner size="lg" />
      <p className="mt-4 text-dark-400">Cargando...</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 animate-pulse">
      <div className="h-4 bg-dark-700 rounded w-1/3 mb-4" />
      <div className="h-8 bg-dark-700 rounded w-1/2 mb-2" />
      <div className="h-3 bg-dark-700 rounded w-1/4" />
    </div>
  );
}
