'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StatusPieChartProps {
  data: { status: string; total: number }[];
  title: string;
  loading?: boolean;
}

const COLORS: Record<string, string> = {
  SUCCESS: '#22c55e',   // Green-500
  FAILED: '#ef4444',    // Red-500
  CALLING: '#06b6d4',   // Cyan-500
  NOT_CALLED: '#94a3b8', // Slate-400 (Adjusted for better visibility)
  PENDING: '#f59e0b',   // Amber-500
};

const LABELS: Record<string, string> = {
  SUCCESS: 'Exitosas',
  FAILED: 'Fallidas',
  CALLING: 'En llamada',
  NOT_CALLED: 'Sin llamar',
  PENDING: 'Pendientes',
};

// Tooltip personalizado adaptable (Glassmorphism)
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border p-3 rounded-xl shadow-xl outline-none">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full shadow-sm" 
            style={{ backgroundColor: data.payload.color }}
          />
          <span className="text-sm font-medium text-foreground">
            {data.name}
          </span>
          <span className="text-sm font-bold text-foreground ml-auto">
            {data.value}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function StatusPieChart({ data, title, loading }: StatusPieChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="h-6 w-1/3 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-muted/50 rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    name: LABELS[item.status] || item.status,
    color: COLORS[item.status] || '#94a3b8',
  }));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="total"
                nameKey="name"
                stroke="hsl(var(--card))" // Borde del color de la tarjeta para separar segmentos
                strokeWidth={3}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-muted-foreground text-sm font-medium ml-1">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}