'use client';

import { useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CallsChart } from '@/components/charts/CallsChart';
import { StatusPieChart } from '@/components/charts/StatusPieChart';
import { ChannelGauge } from '@/components/charts/ChannelGauge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
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
import { Megaphone, Phone, TrendingUp, Gauge, Trophy } from 'lucide-react';
import Link from 'next/link';
import { formatPercentage } from '@/lib/utils';

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
      console.log('📊 Dashboard update recibido:', update.event);

      // Refrescar overview siempre
      refetchOverview();

      // Si hay cambios en campañas, refrescar todo
      if (update.event === 'call-finished' || update.campaignId) {
        console.log('🔄 Invalidando cache completo del dashboard');
        refetchCalls();
        refetchStatus();
        refetchLeaderboard();
        refetchChannels();
        fetchCampaigns();
      }

      // Si es cambio de canales, refrescar específicamente
      if (update.event === 'channel-update') {
        console.log('📡 Actualizando presión de canales');
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
      console.log('🔄 Polling de respaldo del dashboard');
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
            iconColor="from-accent-violet to-purple-700"
            loading={loadingOverview}
          />
          <StatsCard
            title="Llamadas en Curso"
            value={ivr?.ongoingCalls?.value ?? 0}
            icon={<Phone className="w-5 h-5 text-white" />}
            iconColor="from-accent-cyan to-cyan-700"
            loading={loadingOverview}
          />
          <StatsCard
            title="Tasa de Éxito"
            value={formatPercentage(ivr?.successRate?.value ?? 0)}
            change={ivr?.successRate?.change}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            iconColor="from-primary-500 to-primary-700"
            loading={loadingOverview}
          />
          <StatsCard
            title="Presión de Canales"
            value={channelPressure ? `${((channelPressure.used / channelPressure.total) * 100).toFixed(0)}%` : '0%'}
            icon={<Gauge className="w-5 h-5 text-white" />}
            iconColor="from-accent-amber to-orange-600"
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
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent-amber" />
                <h3 className="text-lg font-semibold text-white">Top Campañas</h3>
              </div>
              <Link href="/campaigns" className="text-sm text-primary-400 hover:text-primary-300">
                Ver todas
              </Link>
            </CardHeader>
            <CardContent>
              {loadingLeaderboard ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-dark-700/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((campaign, index) => (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.id}`}
                      className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            index === 0
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : index === 1
                              ? 'bg-gray-400/20 text-gray-400'
                              : index === 2
                              ? 'bg-amber-700/20 text-amber-600'
                              : 'bg-dark-700 text-dark-400'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-white">{campaign.name}</p>
                          <p className="text-xs text-dark-400">{campaign.total} contactos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary-400">
                          {formatPercentage(campaign.successrate)}
                        </p>
                        <p className="text-xs text-dark-400">{campaign.ok} exitosas</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-dark-400">No hay campañas para mostrar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Campañas Recientes</h3>
            <Link href="/campaigns" className="text-sm text-primary-400 hover:text-primary-300">
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
                    className="p-4 bg-dark-800/50 rounded-xl border border-dark-700/50 hover:border-primary-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white truncate">{campaign.name}</h4>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-dark-400">
                      <span>{campaign.concurrentCalls} canales</span>
                      <span>{campaign.maxRetries} reintentos</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-dark-400">No hay campañas para mostrar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}