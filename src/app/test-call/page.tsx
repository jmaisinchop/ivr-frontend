'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { amiApi } from '@/lib/api';
import { Phone, MessageSquare, AlertCircle, CheckCircle, Info } from 'lucide-react';
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
          <div className="rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 p-4 flex items-start gap-4 shadow-sm">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full shrink-0">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Información</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400/80 mt-1 leading-relaxed">
                Esta herramienta permite probar el sistema de llamadas con texto a voz (TTS).
                La llamada se realizará a través del sistema Asterisk configurado.
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b border-border/40">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                Configurar Llamada
              </h3>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <Input
                label="Número de teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0991234567"
                helperText="Ingresa el número sin espacios ni guiones"
              />

              <div className="space-y-3">
                <Textarea
                  label="Mensaje a reproducir"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe el mensaje que será convertido a voz..."
                  rows={4}
                />
                
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Plantillas rápidas</span>
                  <div className="flex flex-wrap gap-2">
                    {presetMessages.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setMessage(preset.text)}
                        className="px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-all border border-transparent hover:border-primary/20"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={handleTestCall} isLoading={loading} className="w-full h-12 text-base shadow-md" size="lg">
                <Phone className="w-4 h-4 mr-2" />
                Iniciar Llamada de Prueba
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <div className={`rounded-2xl border p-4 flex items-start gap-4 shadow-sm animate-in slide-in-from-bottom-2 ${
              result.success
                ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30'
                : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
            }`}>
              <div className={`p-2 rounded-full shrink-0 ${
                result.success ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'
              }`}>
                {result.success ? (
                  <CheckCircle className={`w-5 h-5 ${result.success ? 'text-green-600 dark:text-green-400' : ''}`} />
                ) : (
                  <AlertCircle className={`w-5 h-5 ${!result.success ? 'text-red-600 dark:text-red-400' : ''}`} />
                )}
              </div>
              <div>
                <h4 className={`text-sm font-semibold ${
                  result.success ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'
                }`}>
                  {result.success ? 'Llamada Iniciada' : 'Error'}
                </h4>
                <p className={`text-sm mt-1 ${
                  result.success ? 'text-green-700 dark:text-green-400/80' : 'text-red-700 dark:text-red-400/80'
                }`}>
                  {result.message}
                </p>
              </div>
            </div>
          )}

          {/* Tips */}
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-500" />
                Consejos para mensajes TTS
              </h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <span>Usa frases cortas y claras para mejor comprensión del motor de voz.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <span>Evita abreviaciones complejas, es mejor escribirlas completas ("Doctor" en vez de "Dr.").</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <span>Los números largos se leen mejor si los separas con espacios o guiones.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <span>Usa comas y puntos para controlar las pausas naturales de la voz.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}