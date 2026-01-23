'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

interface StatusPieChartProps {
  data: { status: string; total: number }[];
  title: string;
  loading?: boolean;
}

const COLORS: Record<string, string> = {
  SUCCESS: '#22c55e',
  FAILED: '#ef4444',
  CALLING: '#06b6d4',
  NOT_CALLED: '#64748b',
  PENDING: '#f59e0b',
};

const LABELS: Record<string, string> = {
  SUCCESS: 'Exitosas',
  FAILED: 'Fallidas',
  CALLING: 'En llamada',
  NOT_CALLED: 'Sin llamar',
  PENDING: 'Pendientes',
};

export function StatusPieChart({ data, title, loading }: StatusPieChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-dark-700/50 rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    name: LABELS[item.status] || item.status,
    color: COLORS[item.status] || '#64748b',
  }));

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="total"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-dark-300 text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
