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

  const getColor = () => {
    if (percentage >= 90) return 'from-red-500 to-red-600';
    if (percentage >= 70) return 'from-yellow-500 to-orange-500';
    return 'from-primary-500 to-primary-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Uso de Canales</h3>
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-dark-700/50 rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-white">Uso de Canales</h3>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* Circular gauge */}
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-dark-700"
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#gaugeGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${percentage * 4.4} 440`}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" className={cn('stop-color-primary-500', percentage >= 70 && 'stop-color-yellow-500', percentage >= 90 && 'stop-color-red-500')} stopColor={percentage >= 90 ? '#ef4444' : percentage >= 70 ? '#eab308' : '#22c55e'} />
                  <stop offset="100%" className={cn('stop-color-primary-600', percentage >= 70 && 'stop-color-orange-500', percentage >= 90 && 'stop-color-red-600')} stopColor={percentage >= 90 ? '#dc2626' : percentage >= 70 ? '#f97316' : '#16a34a'} />
                </linearGradient>
              </defs>
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{percentage.toFixed(0)}%</span>
              <span className="text-xs text-dark-400">En uso</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 w-full mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-xs text-dark-400">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-400">{used}</p>
              <p className="text-xs text-dark-400">En uso</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{available}</p>
              <p className="text-xs text-dark-400">Disponibles</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
