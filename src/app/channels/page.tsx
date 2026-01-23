'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ChannelGauge } from '@/components/charts/ChannelGauge';
import { statsApi, systemChannelsApi, channelLimitsApi } from '@/lib/api';
import { ChannelLimit } from '@/types';
import { PageLoading } from '@/components/ui/Spinner';
import { Settings, Users, Gauge, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChannelsPage() {
  const [loading, setLoading] = useState(true);
  const [systemTotal, setSystemTotal] = useState(0);
  const [channelLimits, setChannelLimits] = useState<ChannelLimit[]>([]);
  const [usageSnapshot, setUsageSnapshot] = useState<any[]>([]);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [newSystemTotal, setNewSystemTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [totalRes, limitsRes, usageRes] = await Promise.all([
        systemChannelsApi.getTotal(),
        channelLimitsApi.getAll(),
        statsApi.getChannelsUsage(),
      ]);
      setSystemTotal(totalRes.data.totalChannels);
      setChannelLimits(limitsRes.data);
      setUsageSnapshot(usageRes.data);
    } catch (error) {
      toast.error('Error cargando datos de canales');
    } finally {
      setLoading(false);
    }
  };

  const handleSetSystemTotal = async () => {
    setSubmitting(true);
    try {
      await systemChannelsApi.setTotal(newSystemTotal);
      toast.success('Total de canales actualizado');
      setShowSystemModal(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error actualizando canales');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAssigned = channelLimits.reduce((acc, cl) => acc + (cl.maxChannels || 0), 0);
  const totalUsed = usageSnapshot.reduce((acc, u) => acc + parseInt(u.used || 0), 0);
  const availableToAssign = systemTotal - totalAssigned;

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <Header title="Gestión de Canales" subtitle="Configuración y monitoreo de canales del sistema" />

      <div className="p-6 space-y-6">
        {/* System overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-400">Total Sistema</p>
                  <p className="text-3xl font-bold text-white">{systemTotal}</p>
                </div>
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-primary-400" />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 w-full"
                onClick={() => {
                  setNewSystemTotal(systemTotal);
                  setShowSystemModal(true);
                }}
              >
                Configurar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-400">Asignados</p>
                  <p className="text-3xl font-bold text-accent-cyan">{totalAssigned}</p>
                </div>
                <div className="w-12 h-12 bg-accent-cyan/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent-cyan" />
                </div>
              </div>
              <p className="text-xs text-dark-500 mt-4">
                {((totalAssigned / systemTotal) * 100).toFixed(0)}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-400">En Uso</p>
                  <p className="text-3xl font-bold text-accent-amber">{totalUsed}</p>
                </div>
                <div className="w-12 h-12 bg-accent-amber/20 rounded-xl flex items-center justify-center">
                  <Gauge className="w-6 h-6 text-accent-amber" />
                </div>
              </div>
              <p className="text-xs text-dark-500 mt-4">
                {totalAssigned > 0 ? ((totalUsed / totalAssigned) * 100).toFixed(0) : 0}% de asignados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-400">Disponibles</p>
                  <p className="text-3xl font-bold text-green-400">{availableToAssign}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <p className="text-xs text-dark-500 mt-4">Para asignar a usuarios</p>
            </CardContent>
          </Card>
        </div>

        {/* Gauge and usage by user */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChannelGauge
            total={systemTotal}
            used={totalUsed}
            available={systemTotal - totalUsed}
          />

          <Card className="lg:col-span-2">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Uso por Usuario</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageSnapshot.map((item) => {
                  const percentage = item.max > 0 ? (parseInt(item.used) / item.max) * 100 : 0;
                  return (
                    <div key={item.userId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{item.username}</span>
                        <span className="text-sm text-dark-400">
                          {item.used} / {item.max} canales
                        </span>
                      </div>
                      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage >= 90
                              ? 'bg-red-500'
                              : percentage >= 70
                              ? 'bg-yellow-500'
                              : 'bg-primary-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {usageSnapshot.length === 0 && (
                  <p className="text-center text-dark-400 py-8">
                    No hay usuarios con canales asignados
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Channel limits table */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Límites por Usuario</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Usuario</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">Máximo</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">En Uso</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">Disponibles</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">Uso %</th>
                  </tr>
                </thead>
                <tbody>
                  {channelLimits.map((limit) => {
                    const usage = usageSnapshot.find((u) => u.userId === limit.user?.id);
                    const used = usage ? parseInt(usage.used) : 0;
                    const percentage = limit.maxChannels > 0 ? (used / limit.maxChannels) * 100 : 0;

                    return (
                      <tr key={limit.id} className="border-b border-dark-700/50 hover:bg-dark-800/50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-white">{limit.user?.username || 'N/A'}</p>
                          <p className="text-xs text-dark-400">
                            {limit.user?.firstName} {limit.user?.lastName}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right text-white font-medium">
                          {limit.maxChannels}
                        </td>
                        <td className="py-3 px-4 text-right text-accent-cyan">{used}</td>
                        <td className="py-3 px-4 text-right text-green-400">
                          {limit.maxChannels - used}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-medium ${
                              percentage >= 90
                                ? 'text-red-400'
                                : percentage >= 70
                                ? 'text-yellow-400'
                                : 'text-primary-400'
                            }`}
                          >
                            {percentage.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Modal */}
      <Modal
        isOpen={showSystemModal}
        onClose={() => setShowSystemModal(false)}
        title="Configurar Total de Canales"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-dark-400">
            Define el número total de canales disponibles en el sistema. Los usuarios pueden tener
            asignado un máximo de este valor en conjunto.
          </p>
          <Input
            label="Total de canales del sistema"
            type="number"
            min={0}
            value={newSystemTotal}
            onChange={(e) => setNewSystemTotal(parseInt(e.target.value) || 0)}
          />
          {newSystemTotal < totalAssigned && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">
                ⚠️ El nuevo total es menor que los canales ya asignados ({totalAssigned}).
                Deberás reducir las asignaciones de usuarios primero.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowSystemModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSetSystemTotal} isLoading={submitting}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
