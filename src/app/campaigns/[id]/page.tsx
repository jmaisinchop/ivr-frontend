'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ContactsTable } from '@/components/campaigns/ContactsTable';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import AddContactsModal from '@/components/campaigns/AddContactsModal';
import { useCampaignStore } from '@/stores/campaign.store';
import { useDashboardUpdates } from '@/hooks/useSocket';
import { formatDate, formatDateInput } from '@/lib/utils';
import { PageLoading } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/auth.store';
import * as XLSX from 'xlsx';
import {
  Play,
  Pause,
  XCircle,
  Edit2,
  UserPlus,
  Calendar,
  RefreshCw,
  Phone,
  ArrowLeft,
  Settings,
  Activity,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { token } = useAuthStore();

  const {
    currentCampaign: campaign,
    fetchCampaignById,
    updateCampaign,
    addContacts,
    startCampaign,
    pauseCampaign,
    cancelCampaign,
    isLoading,
  } = useCampaignStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddContactsModal, setShowAddContactsModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCampaignById(campaignId);
  }, [campaignId, fetchCampaignById]);

  useDashboardUpdates(
    useCallback(
      (update) => {
        if (update.campaignId === campaignId) {
          fetchCampaignById(campaignId);
        }
      },
      [campaignId, fetchCampaignById]
    )
  );

  // --- Lógica de Exportación a Excel (.xlsx) CORREGIDA ---
  const handleExport = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${campaignId}/contacts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Error al obtener datos');

      const contacts = await response.json();

      if (!contacts || contacts.length === 0) {
        toast('La campaña no tiene contactos para exportar', { icon: 'ℹ️' });
        setDownloading(false);
        return;
      }

      // CORRECCIÓN: Mapeo exacto según tu backend (getRawMany con alias)
      const dataToExport = contacts.map((c: any) => ({
        'ID': c.id,
        'Nombre': c.name,
        'Teléfono': c.phone,
        'Identificación': c.identification || '-',
        'Estado': c.status,      // Backend devuelve 'status' (alias), no 'callStatus'
        'Intentos': c.retries,   // Backend devuelve 'retries' (alias), no 'attemptCount'
        'Mensaje': c.message || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      
      const wscols = [
        { wch: 10 }, // ID
        { wch: 30 }, // Nombre
        { wch: 15 }, // Teléfono
        { wch: 15 }, // Identificación
        { wch: 15 }, // Estado
        { wch: 10 }, // Intentos
        { wch: 50 }, // Mensaje
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Contactos");

      XLSX.writeFile(workbook, `Reporte_Campaña_${campaign?.name || 'export'}.xlsx`);

      toast.success('Excel generado correctamente');
    } catch (error: any) {
      console.error(error);
      toast.error('Error al exportar contactos');
    } finally {
      setDownloading(false);
    }
  };
  // --------------------------------------------------------

  const handleStart = async () => {
    try {
      await startCampaign(campaignId);
      toast.success('Campaña iniciada');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePause = async () => {
    try {
      await pauseCampaign(campaignId);
      toast.success('Campaña pausada');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancel = async () => {
    if (confirm('¿Estás seguro de cancelar esta campaña? Esta acción no se puede deshacer.')) {
      try {
        await cancelCampaign(campaignId);
        toast.success('Campaña cancelada');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleUpdate = async (data: any) => {
    setUpdating(true);
    try {
      await updateCampaign(campaignId, data);
      toast.success('Campaña actualizada');
      setShowEditModal(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddContacts = async (contacts: any[]) => {
    await addContacts(campaignId, contacts);
  };

  if (isLoading || !campaign) {
    return (
      <DashboardLayout>
        <PageLoading />
      </DashboardLayout>
    );
  }

  const canStart = ['SCHEDULED', 'PAUSED'].includes(campaign.status);
  const canPause = campaign.status === 'RUNNING';
  const canCancel = !['COMPLETED', 'CANCELLED'].includes(campaign.status);
  const canEdit = !['COMPLETED', 'CANCELLED'].includes(campaign.status);
  const canAddContacts = !['COMPLETED', 'CANCELLED', 'RUNNING'].includes(campaign.status);

  return (
    <DashboardLayout>
      <Header title={campaign.name} subtitle={`ID: ${campaign.id}`} />

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            href="/campaigns"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver a campañas
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleExport} 
              isLoading={downloading}
              className="bg-background shadow-sm hover:bg-accent"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>

            {canStart && (
              <Button onClick={handleStart} className="shadow-sm">
                <Play className="w-4 h-4 mr-2 fill-current" />
                Iniciar
              </Button>
            )}
            {canPause && (
              <Button variant="secondary" onClick={handlePause} className="bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50">
                <Pause className="w-4 h-4 mr-2 fill-current" />
                Pausar
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" onClick={() => setShowEditModal(true)} className="bg-background">
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
            {canCancel && (
              <Button variant="danger" onClick={handleCancel}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <div className="mt-1">
                    <StatusBadge status={campaign.status} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Canales</p>
                  <p className="text-xl font-bold text-foreground">{campaign.concurrentCalls}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reintentos</p>
                  <p className="text-xl font-bold text-foreground">{campaign.maxRetries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Período</p>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {formatDate(campaign.startDate, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      hasta {formatDate(campaign.endDate, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/5 px-6 py-4">
            <h3 className="text-lg font-bold text-foreground">Contactos de la Campaña</h3>
            {canAddContacts && (
              <Button size="sm" onClick={() => setShowAddContactsModal(true)} className="shadow-sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Agregar Contactos
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6">
              <ContactsTable campaignId={campaignId} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Campaña"
        size="lg"
      >
        <CampaignForm
          initialData={{
            name: campaign.name,
            startDate: formatDateInput(new Date(campaign.startDate)),
            endDate: formatDateInput(new Date(campaign.endDate)),
            maxRetries: campaign.maxRetries,
            concurrentCalls: campaign.concurrentCalls,
            retryOnAnswer: campaign.retryOnAnswer,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditModal(false)}
          isLoading={updating}
          submitLabel="Guardar Cambios"
        />
      </Modal>

      <AddContactsModal
        isOpen={showAddContactsModal}
        onClose={() => setShowAddContactsModal(false)}
        onAdd={handleAddContacts}
      />
    </DashboardLayout>
  );
}