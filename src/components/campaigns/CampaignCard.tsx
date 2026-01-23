'use client';

import Link from 'next/link';
import { Campaign } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Calendar, Users, RefreshCw, Phone, Play, Pause, XCircle, Copy } from 'lucide-react';
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

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <div className="group relative bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-6 hover:border-primary-500/50 hover:bg-dark-800/80 transition-all duration-300">
        {/* Status indicator */}
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
          <div className={`w-full h-full rounded-bl-[100px] ${
            campaign.status === 'RUNNING' ? 'bg-green-500' :
            campaign.status === 'PAUSED' ? 'bg-yellow-500' :
            campaign.status === 'SCHEDULED' ? 'bg-blue-500' :
            campaign.status === 'COMPLETED' ? 'bg-gray-500' :
            'bg-red-500'
          }`} />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                {campaign.name}
              </h3>
              <StatusBadge status={campaign.status} className="mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(campaign.startDate, { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <Phone className="w-4 h-4" />
              <span>{campaign.concurrentCalls} canales</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <RefreshCw className="w-4 h-4" />
              <span>{campaign.maxRetries} reintentos</span>
            </div>
            {campaign.retryOnAnswer && (
              <div className="flex items-center gap-2 text-sm text-yellow-400">
                <RefreshCw className="w-4 h-4" />
                <span>Reintento auto</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-dark-700/50">
            {canStart && (
              <Button size="sm" variant="ghost" onClick={handleStart} className="flex-1">
                <Play className="w-4 h-4 mr-1" />
                Iniciar
              </Button>
            )}
            {canPause && (
              <Button size="sm" variant="ghost" onClick={handlePause} className="flex-1">
                <Pause className="w-4 h-4 mr-1" />
                Pausar
              </Button>
            )}
            {canCancel && (
              <Button size="sm" variant="ghost" onClick={handleCancel} className="text-red-400 hover:text-red-300">
                <XCircle className="w-4 h-4" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleDuplicate}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
