'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface ChannelGaugeProps {
  total: number;
  used: number;
  available: number;
  loading?: boolean;
}

export function ChannelGauge({ total, used, available, loading }: ChannelGaugeProps) {
  const percentage = total > 0 ? (used / total) * 100 : 0;

  // Determinar colores del gradiente según el uso
  const getGradientColors = () => {
    if (percentage >= 90) return { start: '#ef4444', end: '#dc2626' }; // Red
    if (percentage >= 70) return { start: '#eab308', end: '#f97316' }; // Yellow/Orange
    return { start: '#22c55e', end: '#16a34a' }; // Green
  };

  const gradientColors = getGradientColors();

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="h-6 w-1/2 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4">
             <div className="w-40 h-40 rounded-full border-4 border-muted/30 border-t-muted animate-spin mb-6" />
             <div className="w-full h-12 bg-muted/50 rounded-lg animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold text-foreground tracking-tight">Uso de Canales</h3>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* Circular gauge */}
          <div className="relative w-48 h-48 py-4">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50%"
                cy="50%"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx="50%"
                cy="50%"
                r="70"
                stroke="url(#gaugeGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${percentage * 4.4} 440`}
                className="transition-all duration-1000 ease-out drop-shadow-sm"
              />
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={gradientColors.start} />
                  <stop offset="100%" stopColor={gradientColors.end} />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-foreground tracking-tighter">
                {percentage.toFixed(0)}%
              </span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                En uso
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 w-full mt-2">
            <div className="flex flex-col items-center p-2 rounded-xl bg-muted/30 border border-border/50">
              <span className="text-xs font-medium text-muted-foreground uppercase">Total</span>
              <span className="text-xl font-bold text-foreground">{total}</span>
            </div>
            
            <div className="flex flex-col items-center p-2 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">En uso</span>
              <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{used}</span>
            </div>
            
            <div className="flex flex-col items-center p-2 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Libres</span>
              <span className="text-xl font-bold text-green-700 dark:text-green-300">{available}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}