'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { amiApi } from '@/lib/api';
import { Phone, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TestCallPage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestCall = async () => {
    if (!phone.trim()) {
      toast.error('Ingresa un número de teléfono');
      return;
    }
    if (!message.trim()) {
      toast.error('Ingresa un mensaje');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await amiApi.testCall(message, phone);
      setResult({ success: true, message: response.data.message || 'Llamada iniciada correctamente' });
      toast.success('Llamada de prueba iniciada');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Error al iniciar la llamada';
      setResult({ success: false, message: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const presetMessages = [
    {
      label: 'Recordatorio de pago',
      text: 'Hola, le recordamos que tiene un pago pendiente. Por favor comuníquese con nuestras oficinas.',
    },
    {
      label: 'Confirmación de cita',
      text: 'Hola, este es un recordatorio de su cita programada. Por favor confirme su asistencia.',
    },
    {
      label: 'Prueba de audio',
      text: 'Esta es una llamada de prueba del sistema IVR. El audio se escucha correctamente.',
    },
  ];

  return (
    <DashboardLayout>
      <Header title="Test de Llamada" subtitle="Prueba el sistema de llamadas TTS" />

      <div className="p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Info card */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-medium">Información</p>
                  <p className="text-sm text-dark-300 mt-1">
                    Esta herramienta permite probar el sistema de llamadas con texto a voz (TTS).
                    La llamada se realizará a través del sistema Asterisk configurado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary-400" />
                Configurar Llamada de Prueba
              </h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="Número de teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0991234567"
                helperText="Ingresa el número sin espacios ni guiones"
              />

              <div>
                <Textarea
                  label="Mensaje a reproducir"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe el mensaje que será convertido a voz..."
                  rows={4}
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {presetMessages.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setMessage(preset.text)}
                      className="px-3 py-1.5 text-xs bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white rounded-lg transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleTestCall} isLoading={loading} className="w-full" size="lg">
                <Phone className="w-4 h-4 mr-2" />
                Iniciar Llamada de Prueba
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card
              className={
                result.success
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-red-500/30 bg-red-500/5'
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                      {result.success ? 'Llamada Iniciada' : 'Error'}
                    </p>
                    <p className="text-sm text-dark-300 mt-1">{result.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-accent-cyan" />
                Consejos para mensajes TTS
              </h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-dark-300">
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">•</span>
                  Usa frases cortas y claras para mejor comprensión
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">•</span>
                  Evita abreviaciones, escríbelas completas
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">•</span>
                  Los números se leen mejor separados (uno dos tres...)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">•</span>
                  Usa puntuación para controlar las pausas
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">•</span>
                  Prueba el mensaje antes de usarlo en campañas masivas
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
