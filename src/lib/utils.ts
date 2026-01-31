import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-EC', options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateInput(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-EC').format(value);
}

export function getStatusColor(status: string): string {
  // CLAVE: Usamos clases 'dark:' para diferenciar los modos
  // Light Mode: bg-color-100 text-color-700 (Pastel legible)
  // Dark Mode: bg-color-500/20 text-color-400 (Neón brillante)
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700 border-transparent dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
    
    RUNNING: 'bg-green-100 text-green-700 border-transparent dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30',
    
    PAUSED: 'bg-amber-100 text-amber-700 border-transparent dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30',
    
    COMPLETED: 'bg-slate-100 text-slate-700 border-transparent dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30',
    
    CANCELLED: 'bg-red-100 text-red-700 border-transparent dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
    
    SUCCESS: 'bg-emerald-100 text-emerald-700 border-transparent dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30',
    
    FAILED: 'bg-rose-100 text-rose-700 border-transparent dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
    
    CALLING: 'bg-cyan-100 text-cyan-700 border-transparent dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/30',
    
    NOT_CALLED: 'bg-gray-100 text-gray-700 border-transparent dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30',
  };
  
  return colors[status] || 'bg-gray-100 text-gray-700 border-transparent dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    SCHEDULED: 'Programada',
    RUNNING: 'En ejecución',
    PAUSED: 'Pausada',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    SUCCESS: 'Exitosa',
    FAILED: 'Fallida',
    CALLING: 'Llamando',
    NOT_CALLED: 'Sin llamar',
  };
  return labels[status] || status;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    CALLCENTER: 'Agente',
  };
  return labels[role] || role;
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700 border-transparent dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30',
    
    SUPERVISOR: 'bg-indigo-100 text-indigo-700 border-transparent dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
    
    CALLCENTER: 'bg-teal-100 text-teal-700 border-transparent dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30',
  };
  
  return colors[role] || 'bg-gray-100 text-gray-700 border-transparent dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}