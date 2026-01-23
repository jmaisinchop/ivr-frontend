'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { contactosApi } from '@/lib/api';
import { PadreNivel, ContactoExterno, ContactInput } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import { Upload, Database, Users } from 'lucide-react';

interface AddContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (contacts: ContactInput[]) => Promise<void>;
}

type SourceType = 'manual' | 'database';

export function AddContactsModal({ isOpen, onClose, onAdd }: AddContactsModalProps) {
  const [source, setSource] = useState<SourceType>('manual');
  const [manualData, setManualData] = useState('');
  const [defaultMessage, setDefaultMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Database source state
  const [padresNiveles, setPadresNiveles] = useState<PadreNivel[]>([]);
  const [selectedPadre, setSelectedPadre] = useState<PadreNivel | null>(null);
  const [dbContacts, setDbContacts] = useState<ContactoExterno[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);

  useEffect(() => {
    if (source === 'database') {
      loadPadresNiveles();
    }
  }, [source]);

  const loadPadresNiveles = async () => {
    try {
      const { data } = await contactosApi.getPadresNiveles();
      setPadresNiveles(data);
    } catch (error) {
      toast.error('Error cargando niveles');
    }
  };

  const loadContactsFromDb = async () => {
    if (!selectedPadre) return;

    setLoadingDb(true);
    try {
      const { data } = await contactosApi.getContactosPorNivel(
        selectedPadre.niveles_concatenados,
        selectedPadre.es_propia
      );
      setDbContacts(data);
      toast.success(`${data.length} contactos encontrados`);
    } catch (error) {
      toast.error('Error cargando contactos');
    } finally {
      setLoadingDb(false);
    }
  };

  const parseManualData = (): ContactInput[] => {
    const lines = manualData.trim().split('\n').filter((l) => l.trim());
    const contacts: ContactInput[] = [];

    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        contacts.push({
          identification: parts[0] || '',
          name: parts[1] || 'Sin nombre',
          phone: parts[2] || parts[0],
          message: parts[3] || defaultMessage,
        });
      }
    }

    return contacts;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      let contacts: ContactInput[];

      if (source === 'manual') {
        contacts = parseManualData();
        if (contacts.length === 0) {
          toast.error('No se encontraron contactos válidos');
          return;
        }
      } else {
        if (dbContacts.length === 0) {
          toast.error('No hay contactos de la base de datos');
          return;
        }
        contacts = dbContacts.map((c) => ({
          identification: c.cedula,
          name: c.nombre,
          phone: c.numero,
          message: defaultMessage.replace('{nombre}', c.nombre).replace('{valor}', String(c.valorpagado)),
        }));
      }

      await onAdd(contacts);
      toast.success(`${contacts.length} contactos agregados`);
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setManualData('');
    setDefaultMessage('');
    setSelectedPadre(null);
    setDbContacts([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Contactos" size="lg">
      <div className="space-y-6">
        {/* Source selector */}
        <div className="flex gap-4">
          <button
            onClick={() => setSource('manual')}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              source === 'manual'
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-700 hover:border-dark-600'
            }`}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-primary-400" />
            <p className="font-medium text-white">Manual / CSV</p>
            <p className="text-xs text-dark-400 mt-1">Pegar datos manualmente</p>
          </button>
          <button
            onClick={() => setSource('database')}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              source === 'database'
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-700 hover:border-dark-600'
            }`}
          >
            <Database className="w-8 h-8 mx-auto mb-2 text-accent-cyan" />
            <p className="font-medium text-white">Base de Datos</p>
            <p className="text-xs text-dark-400 mt-1">Cargar desde sistema</p>
          </button>
        </div>

        {source === 'manual' ? (
          <>
            <Textarea
              label="Datos de contactos"
              value={manualData}
              onChange={(e) => setManualData(e.target.value)}
              rows={8}
              placeholder="identificacion,nombre,telefono,mensaje
1234567890,Juan Pérez,0991234567,Hola Juan
..."
              helperText="Formato CSV: identificacion,nombre,telefono,mensaje (uno por línea)"
            />
            <Input
              label="Mensaje por defecto"
              value={defaultMessage}
              onChange={(e) => setDefaultMessage(e.target.value)}
              placeholder="Este mensaje se usará si no se especifica uno por contacto"
            />
          </>
        ) : (
          <>
            <div className="space-y-4">
              <Select
                label="Seleccionar cartera/nivel"
                options={[
                  { value: '', label: 'Seleccione una opción' },
                  ...padresNiveles.map((p, i) => ({
                    value: String(i),
                    label: `${p.padre} (${p.niveles_concatenados})`,
                  })),
                ]}
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  setSelectedPadre(isNaN(idx) ? null : padresNiveles[idx]);
                  setDbContacts([]);
                }}
              />

              {selectedPadre && (
                <div className="flex items-center gap-4">
                  <Button onClick={loadContactsFromDb} disabled={loadingDb}>
                    {loadingDb ? <Spinner size="sm" /> : 'Cargar Contactos'}
                  </Button>
                  {dbContacts.length > 0 && (
                    <span className="text-sm text-dark-400">
                      <Users className="w-4 h-4 inline mr-1" />
                      {dbContacts.length} contactos listos
                    </span>
                  )}
                </div>
              )}

              <Input
                label="Mensaje para todos"
                value={defaultMessage}
                onChange={(e) => setDefaultMessage(e.target.value)}
                placeholder="Hola {nombre}, tienes una deuda de {valor} dólares..."
                helperText="Usa {nombre} y {valor} como variables"
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} isLoading={loading}>
            Agregar Contactos
          </Button>
        </div>
      </div>
    </Modal>
  );
}
