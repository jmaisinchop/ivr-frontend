'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  iconColor?: string;
  suffix?: string;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  iconColor = 'from-blue-600 to-blue-400', // Default ajustado para que funcione visualmente
  suffix,
  loading,
}: StatsCardProps) {
  
  const getChangeColor = (val: number) => {
    // Dual Tone: Texto oscuro en Light, Texto brillante en Dark
    if (val > 0) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-500/10';
    if (val < 0) return 'text-rose-600 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-500/10';
    return 'text-muted-foreground bg-muted/50';
  };

  const getChangeIcon = (val: number) => {
    if (val > 0) return <ArrowUp className="w-3.5 h-3.5" />;
    if (val < 0) return <ArrowDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  return (
    <div className="relative group overflow-hidden bg-card border border-border/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Background gradient effect sutil al hacer hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {/* El contenedor del icono mantiene el gradiente pero con sombra suave */}
          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-sm ring-1 ring-black/5', iconColor)}>
            {icon}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-32 bg-muted/50 rounded-md animate-pulse" />
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
              {suffix && <span className="text-lg text-muted-foreground/80 mb-1 font-medium">{suffix}</span>}
            </div>

            {change !== undefined && (
              <div className="mt-3 flex items-center">
                <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', getChangeColor(change))}>
                  {getChangeIcon(change)}
                  <span>
                    {Math.abs(change).toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground ml-2">vs mes anterior</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}