'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
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
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <Select
            options={daysOptions}
            value={String(days)}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="w-48"
          />
          <div className="flex items-center gap-4">
            <Input
              type="date"
              value={reportStart}
              onChange={(e) => setReportStart(e.target.value)}
              className="w-40"
            />
            <span className="text-dark-400">a</span>
            <Input
              type="date"
              value={reportEnd}
              onChange={(e) => setReportEnd(e.target.value)}
              className="w-40"
            />
            <Button onClick={handleDownloadReport} isLoading={downloading}>
              <Download className="w-4 h-4 mr-2" />
              Descargar Reporte
            </Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Tasa de Éxito Promedio</p>
                  <p className="text-2xl font-bold text-white">
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
                <div className="w-12 h-12 bg-accent-cyan/20 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-accent-cyan" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Tasa de Reintento</p>
                  <p className="text-2xl font-bold text-white">
                    {retryRate ? (retryRate.retryRate * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-dark-500">{retryRate?.withRetry || 0} de {retryRate?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Causa Principal de Fallo</p>
                  <p className="text-lg font-bold text-white truncate">{hangupCauses[0]?.cause || 'N/A'}</p>
                  <p className="text-xs text-dark-500">{hangupCauses[0]?.total || 0} casos</p>
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
              <h3 className="text-lg font-semibold text-white">Tendencia de Éxito/Fallo</h3>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={successTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} formatter={(value: number) => [`${(value * 100).toFixed(1)}%`]} />
                    <Legend />
                    <Line type="monotone" dataKey="successRate" name="Tasa de Éxito" stroke="#22c55e" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="failureRate" name="Tasa de Fallo" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hangup causes */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Principales Causas de Colgado</h3>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hangupCauses} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="cause" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={150} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Agent performance */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Rendimiento por Agente</h3>
          </CardHeader>
          <CardContent>
            {loadingAgents ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-dark-700/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Agente</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">Llamadas</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">Exitosas</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">Tasa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentPerf.map((agent) => (
                      <tr key={agent.userid} className="border-b border-dark-700/50 hover:bg-dark-800/50">
                        <td className="py-3 px-4 text-white font-medium">{agent.username}</td>
                        <td className="py-3 px-4 text-right text-dark-300">{agent.totalcalls}</td>
                        <td className="py-3 px-4 text-right text-green-400">{agent.successfulcalls}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${agent.successrate >= 0.7 ? 'text-green-400' : agent.successrate >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {(agent.successrate * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
