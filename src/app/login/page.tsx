'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme } from 'next-themes';
import { 
  ArrowRight, 
  Moon, 
  Sun, 
  Phone, 
  ShieldCheck, 
  Headset,
  Fingerprint
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, token, isLoading, error, clearError } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Evitar hidratación incorrecta del tema
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
    clearError();
  }, [token, router, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      toast.success('Acceso autorizado');
      router.push('/dashboard');
    } catch (err) {
      // Manejado por el store
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden selection:bg-primary/20 transition-colors duration-500">
      
      {/* --- COLUMNA IZQUIERDA: Formulario (Clean iOS) --- */}
      <div className="w-full lg:w-[480px] xl:w-[550px] flex-shrink-0 flex flex-col relative z-20 bg-background/80 backdrop-blur-xl border-r border-border/40">
        
        {/* Header: Logo + Theme Switch */}
        <div className="flex justify-between items-center p-8">
          <div className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-primary rounded-[14px] flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <Phone className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight leading-none">Finsolred</h2>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Contact Center</p>
            </div>
          </div>

          {/* Botón Toggle Tema (Estilo iOS Segmented Control) */}
          {mounted && (
            <div className="bg-muted/50 p-1 rounded-full border border-border/50 flex items-center relative">
               <button
                 onClick={() => setTheme('light')}
                 className={cn(
                   "p-2 rounded-full transition-all duration-300 relative z-10",
                   theme === 'light' ? "text-amber-600 bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                 )}
               >
                 <Sun className="w-4 h-4" />
               </button>
               <button
                 onClick={() => setTheme('dark')}
                 className={cn(
                   "p-2 rounded-full transition-all duration-300 relative z-10",
                   theme === 'dark' ? "text-indigo-400 bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                 )}
               >
                 <Moon className="w-4 h-4" />
               </button>
            </div>
          )}
        </div>

        {/* Formulario Central */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
              Bienvenido
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Plataforma de gestión de cobranza y contactabilidad.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-5">
              {/* Input Usuario */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 ml-1">
                  Usuario / Agente
                </label>
                <div className="relative group">
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-lg px-5 pl-5"
                    placeholder="Ingrese su usuario"
                    required
                  />
                </div>
              </div>

              {/* Input Contraseña */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Contraseña
                  </label>
                </div>
                <div className="relative group">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-lg px-5"
                    placeholder="••••••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 text-destructive text-sm font-medium flex items-center gap-3 animate-in shake">
                 <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                 {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl text-lg font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300" 
              isLoading={isLoading}
            >
              Iniciar Sesión <ArrowRight className="w-5 h-5 ml-2 opacity-80" />
            </Button>
            
          </form>

        </div>

        {/* Footer */}
        <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-6 opacity-60">
           <div className="flex items-center gap-1.5">
             <ShieldCheck className="w-3.5 h-3.5" />
             <span>Conexión Segura</span>
           </div>
           <div className="w-1 h-1 rounded-full bg-border" />
           <div className="flex items-center gap-1.5">
             <Fingerprint className="w-3.5 h-3.5" />
             <span>Finsolred v2.0</span>
           </div>
        </div>
      </div>

      {/* --- COLUMNA DERECHA: Visual Abstracto (Fondo Apple Style) --- */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-black items-center justify-center">
        
        {/* Fondo Base */}
        <div className="absolute inset-0 bg-neutral-900" />

        {/* Orbes de color animados (Efecto Aurora) */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-600/30 rounded-full blur-[150px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse duration-[10000ms] delay-1000" />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] animate-bounce duration-[15000ms]" />

        {/* Capa de ruido (Textura) */}
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Tarjeta de Cristal Central (Sin datos falsos) */}
        <div className="relative z-10 p-12 max-w-xl text-center">
            
            {/* Logo Flotante 3D Simulado */}
            <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-white/10 to-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-2xl flex items-center justify-center mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
               <Headset className="w-10 h-10 text-white drop-shadow-lg" />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight drop-shadow-sm">
               Gestión Profesional <br/> de Cobranza
            </h2>
            
            <p className="text-lg text-white/60 leading-relaxed max-w-md mx-auto font-light">
               Tecnología avanzada para optimizar la contactabilidad y mejorar la eficiencia operativa de tu equipo.
            </p>

        </div>

      </div>

    </div>
  );
}