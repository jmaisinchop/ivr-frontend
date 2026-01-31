'use client';

import Link from 'next/link';
import { Campaign } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate, cn } from '@/lib/utils';
import { Calendar, RefreshCw, Phone, Play, Pause, XCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCampaignStore } from '@/stores/campaign.store';
import toast from 'react-hot-toast';

interface CampaignCardProps {
  campaign: Campaign;
  onDuplicate?: (campaign: Campaign) => void;
}

export function CampaignCard({ campaign, onDuplicate }: CampaignCardProps) {
  const { startCampaign, pauseCampaign, cancelCampaign } = useCampaignStore();

  const handleStart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await startCampaign(campaign.id);
      toast.success('Campaña iniciada');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePause = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await pauseCampaign(campaign.id);
      toast.success('Campaña pausada');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('¿Estás seguro de cancelar esta campaña?')) {
      try {
        await cancelCampaign(campaign.id);
        toast.success('Campaña cancelada');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDuplicate?.(campaign);
  };

  const canStart = ['SCHEDULED', 'PAUSED'].includes(campaign.status);
  const canPause = campaign.status === 'RUNNING';
  const canCancel = !['COMPLETED', 'CANCELLED'].includes(campaign.status);

  // Función auxiliar para el color de fondo decorativo
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-green-500';
      case 'PAUSED': return 'bg-amber-500';
      case 'SCHEDULED': return 'bg-blue-500';
      case 'COMPLETED': return 'bg-slate-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-primary';
    }
  };

  return (
    <Link href={`/campaigns/${campaign.id}`} className="block h-full">
      <div className="group relative h-full flex flex-col bg-card hover:bg-accent/5 border border-border/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden">
        
        {/* Decoración de estado (Mancha de color en la esquina) */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.08] dark:opacity-[0.15] pointer-events-none transition-opacity group-hover:opacity-20">
          <div className={cn(
            "w-full h-full rounded-bl-[100px] transition-colors duration-500",
            getStatusColorClass(campaign.status)
          )} />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-1">
                {campaign.name}
              </h3>
              <div className="mt-2.5">
                <StatusBadge status={campaign.status} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              <Calendar className="w-4 h-4 text-primary/70" />
              <span>{formatDate(campaign.startDate, { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              <Phone className="w-4 h-4 text-primary/70" />
              <span>{campaign.concurrentCalls} canales</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              <RefreshCw className="w-4 h-4 text-primary/70" />
              <span>{campaign.maxRetries} reintentos</span>
            </div>
            {campaign.retryOnAnswer && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
                <RefreshCw className="w-4 h-4" />
                <span>Reintento auto</span>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="mt-auto pt-4 border-t border-border/50 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
            {canStart && (
              <Button size="sm" onClick={handleStart} className="flex-1 shadow-sm font-medium">
                <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                Iniciar
              </Button>
            )}
            {canPause && (
              <Button size="sm" variant="secondary" onClick={handlePause} className="flex-1 font-medium bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50">
                <Pause className="w-3.5 h-3.5 mr-1.5 fill-current" />
                Pausar
              </Button>
            )}
            
            <div className="flex items-center gap-1 ml-auto">
               <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleDuplicate}
                title="Duplicar campaña"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Copy className="w-4 h-4" />
              </Button>
              
              {canCancel && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={handleCancel}
                  title="Cancelar campaña"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}