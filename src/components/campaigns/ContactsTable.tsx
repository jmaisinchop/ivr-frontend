'use client';

import { useState, useEffect, useCallback } from 'react';
import { Contact, LiveContactsResponse } from '@/types';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { campaignsApi } from '@/lib/api';
import { useDashboardUpdates } from '@/hooks/useSocket';
import { Phone, Eye, RefreshCw, ChevronLeft, ChevronRight, EyeOff, Headphones, Users, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ContactsTableProps {
  campaignId: string;
  onSpy?: (contactId: string) => void;
}

export function ContactsTable({ campaignId, onSpy }: ContactsTableProps) {
  const [data, setData] = useState<LiveContactsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [spyingContactId, setSpyingContactId] = useState<string | null>(null);
  const [spyingInProgress, setSpyingInProgress] = useState(false);
  const limit = 50;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const [contactsRes, pagesRes] = await Promise.all([
        campaignsApi.getLiveContacts(campaignId, status, limit, page * limit),
        campaignsApi.getPages(campaignId, status, limit),
      ]);
      setData(contactsRes.data);
      setTotalPages(pagesRes.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Error cargando contactos');
    } finally {
      setLoading(false);
    }
  }, [campaignId, status, page]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Auto-refresh cuando llega evento WebSocket
  useDashboardUpdates(
    useCallback(
      (update) => {
        if (update.campaignId === campaignId && update.event === 'call-finished' && autoRefreshEnabled) {
          fetchContacts();
          
          // Si la llamada espiada terminó, resetear estado
          if (update.contactId === spyingContactId) {
            setSpyingContactId(null);
            setSpyingInProgress(false);
            toast.success('La llamada espiada ha finalizado');
          }
        }
      },
      [campaignId, fetchContacts, autoRefreshEnabled, spyingContactId]
    )
  );

  // Polling de respaldo cada 30 segundos (solo si hay llamadas activas)
  useEffect(() => {
    if (!autoRefreshEnabled || !data || data.calling === 0) {
      return;
    }

    const interval = setInterval(() => {
      fetchContacts();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, data, fetchContacts]);

  const handleSpy = async (contactId: string) => {
    setSpyingInProgress(true);
    const toastId = toast.loading('Conectando a la llamada...');
    
    try {
      await campaignsApi.spyCall(contactId);
      setSpyingContactId(contactId);
      toast.success('✓ Conectado a la llamada - Escuchando', { id: toastId });
    } catch (error: any) {
      setSpyingContactId(null);
      toast.error(error.response?.data?.message || 'Error al conectar', { id: toastId });
    } finally {
      setSpyingInProgress(false);
    }
  };

  const handleStopSpy = () => {
    setSpyingContactId(null);
    setSpyingInProgress(false);
    toast.success('Espionaje finalizado');
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(0);
  };

  const statusOptions = [
    { value: 'ALL', label: 'Todos' },
    { value: 'NOT_CALLED', label: 'Sin llamar' },
    { value: 'CALLING', label: 'Llamando' },
    { value: 'SUCCESS', label: 'Exitosas' },
    { value: 'FAILED', label: 'Fallidas' },
    { value: 'PENDING', label: 'Pendientes' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner de espionaje activo */}
      {spyingContactId && (
        <div className="bg-purple-100/80 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-2 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-purple-200 dark:bg-purple-500/20 rounded-full animate-pulse">
              <Headphones className="w-5 h-5 text-purple-700 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-300">
                Monitorización Activa
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-400">
                Estás escuchando una llamada en curso en tiempo real.
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleStopSpy}
            className="border-purple-300 dark:border-purple-500/50 hover:bg-purple-200 dark:hover:bg-purple-500/20 text-purple-900 dark:text-purple-200"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Finalizar
          </Button>
        </div>
      )}

      {/* Stats bar - Diseño iOS Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-card border border-border/50 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm">
            <div className="p-2 bg-secondary rounded-full mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{data.total}</p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
          </div>
          
          <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-800/30 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
            {data.calling > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />}
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/40 rounded-full mb-2">
              <Phone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{data.calling}</p>
            <p className="text-xs font-medium text-cyan-600/70 dark:text-cyan-500 uppercase tracking-wider">Llamando</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-800/30 rounded-xl p-4 flex flex-col items-center justify-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{data.success}</p>
            <p className="text-xs font-medium text-green-600/70 dark:text-green-500 uppercase tracking-wider">Exitosas</p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-800/30 rounded-xl p-4 flex flex-col items-center justify-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full mb-2">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{data.failed}</p>
            <p className="text-xs font-medium text-red-600/70 dark:text-red-500 uppercase tracking-wider">Fallidas</p>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/30 rounded-xl p-4 flex flex-col items-center justify-center">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-full mb-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{data.pending}</p>
            <p className="text-xs font-medium text-amber-600/70 dark:text-amber-500 uppercase tracking-wider">Pendientes</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-4 rounded-xl border border-border/50">
        <Select
          options={statusOptions}
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-full sm:w-56"
        />
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Toggle Auto-Refresh */}
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
            <div className={cn(
              "w-9 h-5 rounded-full relative transition-colors duration-300",
              autoRefreshEnabled ? "bg-primary" : "bg-input"
            )}>
              <input
                type="checkbox"
                checked={autoRefreshEnabled}
                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                className="sr-only"
              />
              <div className={cn(
                "w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow-sm",
                autoRefreshEnabled ? "left-[calc(100%-16px)]" : "left-0.5"
              )} />
            </div>
            <span>Auto-actualizar</span>
          </label>

          <Button variant="outline" size="sm" onClick={fetchContacts} disabled={loading} className="bg-background">
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <Table className="shadow-sm">
          <TableHeader>
            <TableRow>
              <TableCell header>Nombre</TableCell>
              <TableCell header>Teléfono</TableCell>
              <TableCell header>Estado</TableCell>
              <TableCell header>Intentos</TableCell>
              <TableCell header>Causa</TableCell>
              <TableCell header>Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.rows.map((contact) => (
              <TableRow 
                key={contact.id}
                className={cn(
                  "group",
                  spyingContactId === contact.id && "bg-purple-50/80 dark:bg-purple-500/10 border-l-4 border-l-purple-500"
                )}
              >
                <TableCell className="font-semibold text-foreground">
                  {contact.name}
                  {spyingContactId === contact.id && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 animate-pulse">
                      ESPIANDO
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">{contact.phone}</TableCell>
                <TableCell>
                  <StatusBadge status={contact.callStatus} />
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs font-medium">
                    {contact.attemptCount}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate">
                  {contact.hangupCause || '-'}
                </TableCell>
                <TableCell>
                  {contact.callStatus === 'CALLING' && (
                    <>
                      {spyingContactId === contact.id ? (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={handleStopSpy}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-500/20 h-8"
                        >
                          <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                          <span className="text-xs">Parar</span>
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleSpy(contact.id)}
                          disabled={spyingInProgress || spyingContactId !== null}
                          className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          <span className="text-xs">Espiar</span>
                        </Button>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {data?.rows.length === 0 && (
              <TableRow>
                <TableCell className="text-center py-12 text-muted-foreground" colSpan={6}>
                  No se encontraron contactos en esta categoría
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-muted-foreground">
          Página <span className="font-medium text-foreground">{page + 1}</span> de <span className="font-medium text-foreground">{totalPages}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      {autoRefreshEnabled && data && data.calling > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-800/20 rounded-full px-4 py-1.5 mx-auto w-fit animate-in fade-in slide-in-from-bottom-2">
          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></div>
          <span className="font-medium">Sincronización en tiempo real activa</span>
        </div>
      )}
    </div>
  );
}