'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { useCampaignStore } from '@/stores/campaign.store';
import { CreateCampaignDto, Campaign } from '@/types';
import {
  Plus, Search, Filter, MoreHorizontal,
  ArrowLeft, ArrowRight, Calendar, Phone, Activity
} from 'lucide-react';
import {
  Table, TableHeader, TableBody, TableRow, TableCell
} from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { campaignsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CampaignsPage() {
  const { createCampaign, duplicateCampaign } = useCampaignStore();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [meta, setMeta] = useState({ total: 0, lastPage: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [campaignToDuplicate, setCampaignToDuplicate] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);

  // ─── LOG: Modal abre/cierra ────────────────────────────────────────────
  useEffect(() => {
    console.log('📌 [CampaignsPage] showCreateModal cambió a:', showCreateModal);
  }, [showCreateModal]);

  useEffect(() => {
    console.log('📌 [CampaignsPage] showDuplicateModal cambió a:', showDuplicateModal);
  }, [showDuplicateModal]);

  const fetchCampaigns = useCallback(async () => {
    console.log('📌 [CampaignsPage] fetchCampaigns iniciado. Params:', { page, limit, search: debouncedSearch, status: statusFilter });
    setIsLoading(true);
    try {
      const response = await campaignsApi.getAll({
        page, limit,
        search: debouncedSearch,
        status: statusFilter,
      });
      const { data, meta } = response.data;
      if (data) {
        setCampaigns(data);
        setMeta(meta);
        console.log('✅ [CampaignsPage] fetchCampaigns OK. Total:', meta.total);
      }
    } catch (error) {
      console.error('❌ [CampaignsPage] fetchCampaigns error:', error);
      toast.error('Error al cargar el listado de campañas');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  // ─── CREAR ─────────────────────────────────────────────────────────────
  const handleCreate = async (data: CreateCampaignDto) => {
    console.log('▶️  [CampaignsPage] handleCreate INICIO');
    console.log('   data del form:', data);
    setCreating(true);
    try {
      const newCampaign = await createCampaign(data);
      console.log('✅ [CampaignsPage] createCampaign OK. Nueva campaña:', newCampaign);
      toast.success('Campaña creada exitosamente');
      console.log('   Retornando ID al form:', newCampaign?.id);
      return newCampaign?.id;
    } catch (err: any) {
      console.error('❌ [CampaignsPage] handleCreate error:', err);
      toast.error(err.message);
      // Si falla, no retorna → undefined. El form usará campaignId prop (que es undefined en crear)
    } finally {
      setCreating(false);
      console.log('📌 [CampaignsPage] handleCreate FINALIZADO. creating = false');
    }
  };

  // ─── DUPLICAR ──────────────────────────────────────────────────────────
  const handleDuplicate = async (data: CreateCampaignDto) => {
    console.log('▶️  [CampaignsPage] handleDuplicate INICIO');
    console.log('   campaignToDuplicate:', campaignToDuplicate?.id, campaignToDuplicate?.name);
    console.log('   data del form:', data);
    if (!campaignToDuplicate) {
      console.warn('⚠️ [CampaignsPage] handleDuplicate: campaignToDuplicate es null. Abortando.');
      return;
    }
    setCreating(true);
    try {
      const newCampaign = await duplicateCampaign(campaignToDuplicate.id, data);
      console.log('✅ [CampaignsPage] duplicateCampaign OK. Nueva campaña:', newCampaign);
      toast.success('Campaña duplicada correctamente');
      console.log('   Retornando ID al form:', newCampaign?.id);
      return newCampaign?.id;
    } catch (err: any) {
      console.error('❌ [CampaignsPage] handleDuplicate error:', err);
      toast.error(err.message);
    } finally {
      setCreating(false);
      console.log('📌 [CampaignsPage] handleDuplicate FINALIZADO. creating = false');
    }
  };

  const statusOptions = [
    { value: 'ALL', label: 'Todos los estados' },
    { value: 'SCHEDULED', label: 'Programadas' },
    { value: 'RUNNING', label: 'En ejecución' },
    { value: 'PAUSED', label: 'Pausadas' },
    { value: 'COMPLETED', label: 'Completadas' },
    { value: 'CANCELLED', label: 'Canceladas' },
  ];

  return (
    <DashboardLayout>
      <Header title="Campañas" subtitle="Gestiona y monitorea tus campañas de llamadas" />

      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 bg-card p-4 rounded-xl border border-border/50 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-46"
            />
          </div>
          <Button onClick={() => {
            console.log('📌 [CampaignsPage] Abriendo modal de crear');
            setShowCreateModal(true);
          }} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Nueva Campaña
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/30">
                <TableCell header className="w-[300px]">Nombre</TableCell>
                <TableCell header>Estado</TableCell>
                <TableCell header>Configuración</TableCell>
                <TableCell header>Fechas</TableCell>
                <TableCell header className="text-right">Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Filter className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-lg font-medium">No se encontraron campañas</p>
                      <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((camp) => (
                  <TableRow key={camp.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Link href={`/campaigns/${camp.id}`} className="block">
                        <span className="font-semibold text-foreground hover:text-primary transition-colors">{camp.name}</span>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          ID: <span className="font-mono text-[10px]">{camp.id.split('-')[0]}...</span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell><StatusBadge status={camp.status} /></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {camp.concurrentCalls} canales</span>
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {camp.maxRetries} reintentos</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="flex items-center gap-1.5 text-foreground">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          {formatDate(camp.startDate, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs text-muted-foreground ml-5">
                          hasta {formatDate(camp.endDate, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => {
                            console.log('📌 [CampaignsPage] Abriendo modal de duplicar para:', camp.id, camp.name);
                            setCampaignToDuplicate(camp);
                            setShowDuplicateModal(true);
                          }}
                          title="Duplicar"
                        >
                          <span className="sr-only">Duplicar</span>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <Link href={`/campaigns/${camp.id}`}>
                          <Button size="sm" variant="secondary">Ver Detalle</Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between px-4 py-4 border-t border-border/50 bg-muted/10">
            <div className="text-sm text-muted-foreground">
              Mostrando página <span className="font-medium text-foreground">{page}</span> de <span className="font-medium text-foreground">{meta.lastPage}</span>
              <span className="mx-2 text-border">|</span>
              Total: {meta.total} campañas
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="bg-background">
                <ArrowLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))} disabled={page >= meta.lastPage || isLoading} className="bg-background">
                Siguiente <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Crear */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          console.log('📌 [CampaignsPage] Modal Crear onClose (X o click fuera)');
          setShowCreateModal(false);
        }}
        title="Crear Nueva Campaña"
        size="lg"
      >
        <CampaignForm
          onSubmit={handleCreate}
          onCancel={() => {
            console.log('📌 [CampaignsPage] CampaignForm Crear onCancel');
            setShowCreateModal(false);
          }}
          onSuccess={() => {
            console.log('✅ [CampaignsPage] CampaignForm Crear onSuccess → cerrando modal y refetcheando');
            setShowCreateModal(false);
            fetchCampaigns();
          }}
          isLoading={creating}
        />
      </Modal>

      {/* Modal Duplicar */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => {
          console.log('📌 [CampaignsPage] Modal Duplicar onClose (X o click fuera)');
          setShowDuplicateModal(false);
          setCampaignToDuplicate(null);
        }}
        title={`Duplicar: ${campaignToDuplicate?.name}`}
        size="lg"
      >
        {campaignToDuplicate && (
          <CampaignForm
            initialData={{
              name: `${campaignToDuplicate.name} (copia)`,
              maxRetries: campaignToDuplicate.maxRetries,
              concurrentCalls: campaignToDuplicate.concurrentCalls,
              retryOnAnswer: campaignToDuplicate.retryOnAnswer,
            }}
            onSubmit={handleDuplicate}
            onCancel={() => {
              console.log('📌 [CampaignsPage] CampaignForm Duplicar onCancel');
              setShowDuplicateModal(false);
              setCampaignToDuplicate(null);
            }}
            onSuccess={() => {
              console.log('✅ [CampaignsPage] CampaignForm Duplicar onSuccess → cerrando modal y refetcheando');
              setShowDuplicateModal(false);
              setCampaignToDuplicate(null);
              fetchCampaigns();
            }}
            isLoading={creating}
            submitLabel="Duplicar Campaña"
          />
        )}
      </Modal>
    </DashboardLayout>
  );
}