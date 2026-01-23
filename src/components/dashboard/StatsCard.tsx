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
  iconColor = 'from-primary-500 to-primary-700',
  suffix,
  loading,
}: StatsCardProps) {
  const getChangeColor = (val: number) => {
    if (val > 0) return 'text-green-400';
    if (val < 0) return 'text-red-400';
    return 'text-dark-400';
  };

  const getChangeIcon = (val: number) => {
    if (val > 0) return <ArrowUp className="w-3.5 h-3.5" />;
    if (val < 0) return <ArrowDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  return (
    <div className="relative group overflow-hidden bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-6 hover:border-dark-600 transition-all duration-300">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-800/0 to-dark-900/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-dark-400">{title}</span>
          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', iconColor)}>
            {icon}
          </div>
        </div>

        {loading ? (
          <div className="h-9 bg-dark-700 rounded animate-pulse" />
        ) : (
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{value}</span>
            {suffix && <span className="text-lg text-dark-400 mb-1">{suffix}</span>}
          </div>
        )}

        {change !== undefined && !loading && (
          <div className={cn('flex items-center gap-1 mt-2', getChangeColor(change))}>
            {getChangeIcon(change)}
            <span className="text-sm font-medium">
              {Math.abs(change).toFixed(1)}% vs período anterior
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
