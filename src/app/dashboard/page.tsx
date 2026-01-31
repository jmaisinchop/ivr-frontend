'use client';

import { useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CallsChart } from '@/components/charts/CallsChart';
import { StatusPieChart } from '@/components/charts/StatusPieChart';
import { ChannelGauge } from '@/components/charts/ChannelGauge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button'; // <--- Import añadido
import { StatusBadge } from '@/components/ui/Badge';
import {
  useDashboardOverview,
  useCallsDaily,
  useStatusDistribution,
  useCampaignLeaderboard,
  useChannelPressure,
} from '@/hooks/useStats';
import { useDashboardUpdates } from '@/hooks/useSocket';
import { useCampaignStore } from '@/stores/campaign.store';
import { useAuthStore } from '@/stores/auth.store';
import { Megaphone, Phone, TrendingUp, Gauge, Trophy, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';
import { formatPercentage, cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: overview, isLoading: loadingOverview, refetch: refetchOverview } = useDashboardOverview();
  const { data: callsDaily, isLoading: loadingCalls, refetch: refetchCalls } = useCallsDaily(30);
  const { data: statusDist, isLoading: loadingStatus, refetch: refetchStatus } = useStatusDistribution(30);
  const { data: leaderboard, isLoading: loadingLeaderboard, refetch: refetchLeaderboard } = useCampaignLeaderboard(5);
  const { data: channelPressure, isLoading: loadingChannels, refetch: refetchChannels } = useChannelPressure();
  const { campaigns, fetchCampaigns } = useCampaignStore();

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // ✅ Invalidar cache completo cuando llegan eventos
  useDashboardUpdates(
    useCallback((update) => {
      // Refrescar overview siempre
      refetchOverview();

      // Si hay cambios en campañas, refrescar todo
      if (update.event === 'call-finished' || update.campaignId) {
        refetchCalls();
        refetchStatus();
        refetchLeaderboard();
        refetchChannels();
        fetchCampaigns();
      }

      // Si es cambio de canales, refrescar específicamente
      if (update.event === 'channel-update') {
        refetchChannels();
        refetchOverview();
      }
    }, [
      refetchOverview,
      refetchCalls,
      refetchStatus,
      refetchLeaderboard,
      refetchChannels,
      fetchCampaigns
    ])
  );

  // ✅ Polling de respaldo cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refetchOverview();
      refetchChannels();
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, [refetchOverview, refetchChannels]);

  const ivr = overview?.ivr;

  return (
    <DashboardLayout>
      <Header
        title={`Hola, ${user?.firstName || 'Usuario'}`}
        subtitle="Resumen de tu panel de control"
      />

      <div className="p-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Campañas Activas"
            value={ivr?.activeCampaigns?.value ?? 0}
            change={ivr?.activeCampaigns?.change}
            icon={<Megaphone className="w-5 h-5 text-white" />}
            iconColor="from-purple-500 to-indigo-600"
            loading={loadingOverview}
          />
          <StatsCard
            title="Llamadas en Curso"
            value={ivr?.ongoingCalls?.value ?? 0}
            icon={<Activity className="w-5 h-5 text-white" />}
            iconColor="from-cyan-500 to-blue-600"
            loading={loadingOverview}
          />
          <StatsCard
            title="Tasa de Éxito"
            value={formatPercentage(ivr?.successRate?.value ?? 0)}
            change={ivr?.successRate?.change}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            iconColor="from-green-500 to-emerald-600"
            loading={loadingOverview}
          />
          <StatsCard
            title="Presión de Canales"
            value={channelPressure ? `${((channelPressure.used / channelPressure.total) * 100).toFixed(0)}%` : '0%'}
            icon={<Gauge className="w-5 h-5 text-white" />}
            iconColor="from-orange-500 to-red-600"
            loading={loadingChannels}
            suffix={channelPressure ? `${channelPressure.used}/${channelPressure.total}` : ''}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CallsChart data={callsDaily} title="Llamadas por Día (últimos 30 días)" loading={loadingCalls} />
          </div>
          <StatusPieChart data={statusDist} title="Distribución de Estados" loading={loadingStatus} />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Channel gauge */}
          <ChannelGauge
            total={ivr?.channels?.total ?? 0}
            used={ivr?.channels?.used ?? 0}
            available={ivr?.channels?.available ?? 0}
            loading={loadingOverview}
          />

          {/* Campaign leaderboard */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg">
                  <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Top Campañas</h3>
              </div>
              <Link href="/campaigns" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                Ver todas <ArrowRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent className="flex-1">
              {loadingLeaderboard ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((campaign, index) => (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.id}`}
                      className="group flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-border rounded-xl transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm",
                            index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' :
                            index === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400' :
                            index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' :
                            'bg-muted text-muted-foreground'
                          )}
                        >
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">{campaign.total} contactos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">
                          {formatPercentage(campaign.successrate)}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">{campaign.ok} exitosas</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                  <Trophy className="w-12 h-12 mb-3 opacity-20" />
                  <p>No hay campañas para mostrar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-lg font-bold text-foreground">Campañas Recientes</h3>
            <Link href="/campaigns" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {campaigns && campaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.slice(0, 6).map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="p-4 bg-card border border-border/50 rounded-xl hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <h4 className="font-semibold text-foreground truncate mb-2">{campaign.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {campaign.concurrentCalls} canales
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" /> {campaign.maxRetries} reintentos
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No hay campañas creadas aún</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/campaigns'}>
                  Crear Campaña
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}