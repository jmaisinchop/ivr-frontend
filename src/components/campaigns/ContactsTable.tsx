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
import { Phone, Eye, RefreshCw, ChevronLeft, ChevronRight, EyeOff, Headphones } from 'lucide-react';
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
          console.log('🔄 Auto-refresh activado por evento WebSocket');
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
      console.log('🔄 Polling de respaldo activado');
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
    <div className="space-y-4">
      {/* Banner de espionaje activo */}
      {spyingContactId && (
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-3">
            <Headphones className="w-5 h-5 text-purple-400 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-purple-400">
                🎧 Espionaje activo
              </p>
              <p className="text-xs text-purple-500">
                Estás escuchando una llamada en curso
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleStopSpy}>
            <EyeOff className="w-4 h-4 mr-2" />
            Finalizar
          </Button>
        </div>
      )}

      {/* Stats bar */}
      {data && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-dark-800/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{data.total}</p>
            <p className="text-xs text-dark-400">Total</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center relative">
            <p className="text-2xl font-bold text-cyan-400">{data.calling}</p>
            <p className="text-xs text-dark-400">Llamando</p>
            {data.calling > 0 && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{data.success}</p>
            <p className="text-xs text-dark-400">Exitosas</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{data.failed}</p>
            <p className="text-xs text-dark-400">Fallidas</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{data.pending}</p>
            <p className="text-xs text-dark-400">Pendientes</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between">
        <Select
          options={statusOptions}
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-48"
        />
        <div className="flex items-center gap-3">
          {/* Toggle Auto-Refresh */}
          <label className="flex items-center gap-2 text-sm text-dark-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
            />
            <span>Auto-actualizar</span>
          </label>

          <Button variant="ghost" onClick={fetchContacts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <Table>
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
                className={spyingContactId === contact.id ? 'bg-purple-500/10 border-l-2 border-purple-500' : ''}
              >
                <TableCell className="font-medium text-white">
                  {contact.name}
                  {spyingContactId === contact.id && (
                    <span className="ml-2 text-xs text-purple-400">
                      🎧 Espiando
                    </span>
                  )}
                </TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>
                  <StatusBadge status={contact.callStatus} />
                </TableCell>
                <TableCell>{contact.attemptCount}</TableCell>
                <TableCell className="text-dark-400 max-w-[200px] truncate">
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
                          className="text-purple-400 hover:text-purple-300"
                        >
                          <EyeOff className="w-4 h-4 mr-1" />
                          Dejar de espiar
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleSpy(contact.id)}
                          disabled={spyingInProgress || spyingContactId !== null}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Espiar
                        </Button>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-dark-400">
          Página {page + 1} de {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      {autoRefreshEnabled && data && data.calling > 0 && (
        <div className="flex items-center gap-2 text-sm text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <span>Actualizando automáticamente - {data.calling} llamada(s) activa(s)</span>
        </div>
      )}
    </div>
  );
}