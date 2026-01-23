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
import { Phone, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
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
    } finally {
      setLoading(false);
    }
  }, [campaignId, status, page]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Listen to real-time updates
  useDashboardUpdates(
    useCallback(
      (update) => {
        if (update.campaignId === campaignId && update.event === 'call-finished') {
          fetchContacts();
        }
      },
      [campaignId, fetchContacts]
    )
  );

  const handleSpy = async (contactId: string) => {
    try {
      await campaignsApi.spyCall(contactId);
      toast.success('Conectado a la llamada');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al conectar');
    }
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
      {/* Stats bar */}
      {data && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-dark-800/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{data.total}</p>
            <p className="text-xs text-dark-400">Total</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{data.calling}</p>
            <p className="text-xs text-dark-400">Llamando</p>
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
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          className="w-48"
        />
        <Button variant="ghost" onClick={fetchContacts} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
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
              <TableRow key={contact.id}>
                <TableCell className="font-medium text-white">{contact.name}</TableCell>
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
                    <Button size="sm" variant="ghost" onClick={() => handleSpy(contact.id)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Espiar
                    </Button>
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
    </div>
  );
}
