'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { CallsChart } from '@/components/charts/CallsChart';
import { StatusPieChart } from '@/components/charts/StatusPieChart';
import {
  useCallsDaily,
  useCallsMonthly,
  useStatusDistribution,
  useHangupCauses,
  useSuccessTrend,
  useRetryRate,
  useAgentPerformance,
} from '@/hooks/useStats';
import { statsApi } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Download, TrendingUp, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Tooltip reutilizable para gráficos inline
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border p-3 rounded-xl shadow-xl outline-none ring-0">
        <p className="text-foreground font-medium mb-2 text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {entry.name}:
            </span>
            <span className="text-sm font-bold text-foreground">
              {typeof entry.value === 'number' && (entry.name.includes('Tasa') || entry.name.includes('Rate'))
                ? `${(entry.value * 100).toFixed(1)}%`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function StatsPage() {
  const [days, setDays] = useState(30);
  const [reportStart, setReportStart] = useState('');
  const [reportEnd, setReportEnd] = useState('');
  const [downloading, setDownloading] = useState(false);

  const { data: callsDaily, isLoading: loadingDaily } = useCallsDaily(days);
  const { data: callsMonthly, isLoading: loadingMonthly } = useCallsMonthly(12);
  const { data: statusDist, isLoading: loadingStatus } = useStatusDistribution(days);
  const { data: hangupCauses, isLoading: loadingHangup } = useHangupCauses(10, days);
  const { data: successTrend, isLoading: loadingTrend } = useSuccessTrend(days);
  const { data: retryRate, isLoading: loadingRetry } = useRetryRate(days);
  const { data: agentPerf, isLoading: loadingAgents } = useAgentPerformance(days);

  const handleDownloadReport = async () => {
    if (!reportStart || !reportEnd) {
      toast.error('Selecciona las fechas del reporte');
      return;
    }
    setDownloading(true);
    try {
      const response = await statsApi.downloadReport(reportStart, reportEnd);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_campanas_${reportStart}_${reportEnd}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Reporte descargado');
    } catch (error) {
      toast.error('Error descargando el reporte');
    } finally {
      setDownloading(false);
    }
  };

  const daysOptions = [
    { value: '7', label: 'Últimos 7 días' },
    { value: '14', label: 'Últimos 14 días' },
    { value: '30', label: 'Últimos 30 días' },
    { value: '60', label: 'Últimos 60 días' },
    { value: '90', label: 'Últimos 90 días' },
  ];

  return (
    <DashboardLayout>
      <Header title="Estadísticas" subtitle="Análisis detallado de llamadas y campañas" />

      <div className="p-6 space-y-6">
        {/* Filters and report */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-card/50 p-4 rounded-xl border border-border/50">
          <Select
            options={daysOptions}
            value={String(days)}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="w-full lg:w-48"
          />
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                type="date"
                value={reportStart}
                onChange={(e) => setReportStart(e.target.value)}
                className="w-full sm:w-40"
              />
              <span className="text-muted-foreground">a</span>
              <Input
                type="date"
                value={reportEnd}
                onChange={(e) => setReportEnd(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <Button onClick={handleDownloadReport} isLoading={downloading} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasa de Éxito</p>
                  <p className="text-2xl font-bold text-foreground">
                    {successTrend.length > 0
                      ? ((successTrend.reduce((acc, d) => acc + d.successRate, 0) / successTrend.length) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasa de Reintento</p>
                  <p className="text-2xl font-bold text-foreground">
                    {retryRate ? (retryRate.retryRate * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">{retryRate?.withRetry || 0} de {retryRate?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Causa Principal de Fallo</p>
                  <p className="text-lg font-bold text-foreground truncate max-w-[150px]" title={hangupCauses[0]?.cause}>
                    {hangupCauses[0]?.cause || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">{hangupCauses[0]?.total || 0} casos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CallsChart data={callsDaily} title="Llamadas por Día" loading={loadingDaily} />
          <CallsChart data={callsMonthly} title="Llamadas por Mes" loading={loadingMonthly} />
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatusPieChart data={statusDist} title="Distribución de Estados" loading={loadingStatus} />

          <Card className="lg:col-span-2">
            <CardHeader>
              <h3 className="text-lg font-semibold text-foreground">Tendencia de Éxito/Fallo</h3>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {loadingTrend ? (
                  <div className="h-full bg-muted/20 rounded-xl animate-pulse" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={successTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        stroke="hsl(var(--muted-foreground))" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} 
                        dx={-10}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        formatter={(value) => <span className="text-muted-foreground text-sm ml-1">{value}</span>}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="successRate" 
                        name="Tasa de Éxito" 
                        stroke="#22c55e" 
                        strokeWidth={3} 
                        dot={false} 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="failureRate" 
                        name="Tasa de Fallo" 
                        stroke="#ef4444" 
                        strokeWidth={3} 
                        dot={false} 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hangup causes */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Principales Causas de Colgado</h3>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {loadingHangup ? (
                <div className="h-full bg-muted/20 rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hangupCauses} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis 
                      type="number" 
                      stroke="hsl(var(--muted-foreground))" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      type="category" 
                      dataKey="cause" 
                      stroke="hsl(var(--muted-foreground))" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false} 
                      width={180} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="total" 
                      name="Total" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]} 
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agent performance */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Rendimiento por Agente</h3>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAgents ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted/20 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <Table className="border-0 shadow-none">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableCell header>Agente</TableCell>
                    <TableCell header className="text-right">Llamadas</TableCell>
                    <TableCell header className="text-right">Exitosas</TableCell>
                    <TableCell header className="text-right">Tasa</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentPerf.map((agent) => (
                    <TableRow key={agent.userid}>
                      <TableCell className="font-medium text-foreground">{agent.username}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{agent.totalcalls}</TableCell>
                      <TableCell className="text-right text-green-600 dark:text-green-400 font-medium">{agent.successfulcalls}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold",
                          agent.successrate >= 0.7 
                            ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" 
                            : agent.successrate >= 0.5 
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-yellow-400" 
                              : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                        )}>
                          {(agent.successrate * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {agentPerf.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay datos de rendimiento de agentes en este periodo
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}