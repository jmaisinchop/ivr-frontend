import { cn } from '@/lib/utils';
import { getStatusColor, getStatusLabel, getRoleColor, getRoleLabel } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    // Default: Gris neutro (usando variables del sistema)
    default: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    
    // Success: Verde (Pastel en Light, Neón en Dark)
    success: 'border-transparent bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    
    // Warning: Amarillo/Ámbar
    warning: 'border-transparent bg-amber-100 text-amber-700 dark:bg-yellow-500/20 dark:text-yellow-400',
    
    // Danger: Rojo
    danger: 'border-transparent bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    
    // Info: Azul
    info: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',

    // Outline: Solo borde, sin fondo (útil para variantes sutiles)
    outline: 'text-foreground border-border bg-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // NOTA: Es probable que getStatusColor devuelva clases "hardcodeadas" antiguas.
  // Recomiendo pasar las clases manualmente o actualizar utils.ts después.
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        getStatusColor(status), 
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        getRoleColor(role),
        className
      )}
    >
      {getRoleLabel(role)}
    </span>
  );
}