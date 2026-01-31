'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { ChannelGauge } from '@/components/charts/ChannelGauge';
import { statsApi, systemChannelsApi, channelLimitsApi } from '@/lib/api';
import { ChannelLimit } from '@/types';
import { PageLoading } from '@/components/ui/Spinner';
import { Settings, Users, Gauge, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sistema</p>
                  <p className="text-3xl font-bold text-foreground">{systemTotal}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full bg-background hover:bg-accent"
                onClick={() => {
                  setNewSystemTotal(systemTotal);
                  setShowSystemModal(true);
                }}
              >
                Configurar
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Asignados</p>
                  <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{totalAssigned}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 font-medium">
                {((totalAssigned / systemTotal) * 100).toFixed(0)}% del total
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En Uso</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{totalUsed}</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Gauge className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 font-medium">
                {totalAssigned > 0 ? ((totalUsed / totalAssigned) * 100).toFixed(0) : 0}% de asignados
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Disponibles</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{availableToAssign}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 font-medium">Para asignar a usuarios</p>
            </CardContent>
          </Card>
        </div>

        {/* Gauge and usage by user */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ChannelGauge
              total={systemTotal}
              used={totalUsed}
              available={systemTotal - totalUsed}
            />
          </div>

          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Uso en Tiempo Real por Usuario</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                {usageSnapshot.map((item) => {
                  const percentage = item.max > 0 ? (parseInt(item.used) / item.max) * 100 : 0;
                  return (
                    <div key={item.userId} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-foreground">{item.username}</span>
                        <span className="text-muted-foreground font-mono">
                          {item.used} / {item.max}
                        </span>
                      </div>
                      <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            percentage >= 90 ? 'bg-red-500' :
                            percentage >= 70 ? 'bg-amber-500' :
                            'bg-primary'
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {usageSnapshot.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border">
                    <p>No hay usuarios con canales asignados activamente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Channel limits table */}
        <Card>
          <CardHeader className="border-b border-border/40 pb-4">
            <h3 className="text-lg font-bold text-foreground">Límites Configurados</h3>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="border-0 shadow-none">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableCell header>Usuario</TableCell>
                  <TableCell header className="text-right">Límite Máximo</TableCell>
                  <TableCell header className="text-right">En Uso</TableCell>
                  <TableCell header className="text-right">Disponibles</TableCell>
                  <TableCell header className="text-right">Utilización</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelLimits.map((limit) => {
                  const usage = usageSnapshot.find((u) => u.userId === limit.user?.id);
                  const used = usage ? parseInt(usage.used) : 0;
                  const percentage = limit.maxChannels > 0 ? (used / limit.maxChannels) * 100 : 0;

                  return (
                    <TableRow key={limit.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{limit.user?.username || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">
                            {limit.user?.firstName} {limit.user?.lastName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-foreground">
                        {limit.maxChannels}
                      </TableCell>
                      <TableCell className="text-right text-cyan-600 dark:text-cyan-400 font-bold">
                        {used}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        {limit.maxChannels - used}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold",
                            percentage >= 90 ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                            percentage >= 70 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-yellow-400" :
                            "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                          )}
                        >
                          {percentage.toFixed(0)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
          <p className="text-sm text-muted-foreground leading-relaxed">
            Define el número total de canales disponibles en el sistema (troncales SIP/E1).
            Este valor es el límite físico global de la central telefónica.
          </p>
          
          <Input
            label="Total de canales del sistema"
            type="number"
            min={0}
            value={newSystemTotal}
            onChange={(e) => setNewSystemTotal(parseInt(e.target.value) || 0)}
          />
          
          {newSystemTotal < totalAssigned && (
            <div className="p-3 bg-red-100/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg flex gap-3 animate-in slide-in-from-top-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-300">
                El nuevo total es menor que los canales ya asignados ({totalAssigned}).
                Esto podría causar errores de asignación.
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50 mt-6">
            <Button variant="outline" onClick={() => setShowSystemModal(false)} className="bg-background">
              Cancelar
            </Button>
            <Button onClick={handleSetSystemTotal} isLoading={submitting}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}