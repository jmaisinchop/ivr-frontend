import { io, Socket } from 'socket.io-client';
import { DashboardUpdate } from '@/types';

// URL del WebSocket (usa variable de entorno o fallback a localhost)
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

// Interfaces para métricas y control
interface LatencyMetrics {
  current: number;
  average: number;
  min: number;
  max: number;
  samples: number[];
}

class SocketClient {
  // Instancia real de Socket.io
  private socket: Socket | null = null;
  
  // Mapa de listeners internos: Aquí guardamos tus funciones de React
  // Esto actúa como la "memoria" para evitar el error de carrera.
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  // Variables de control de conexión
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;
  private currentToken: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManuallyDisconnected = false;

  // Variables de monitoreo (Ping/Pong)
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTimestamp = 0;
  private readonly MAX_SAMPLES = 20;
  private readonly PING_INTERVAL = 10000; // 10 segundos
  
  private latencyMetrics: LatencyMetrics = {
    current: 0,
    average: 0,
    min: Infinity,
    max: 0,
    samples: [],
  };

  /**
   * Inicia la conexión con el token de autenticación.
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('✅ [Socket] Ya está conectado');
      return;
    }

    this.currentToken = token;
    this.isManuallyDisconnected = false;
    this.attemptConnection();
  }

  /**
   * Lógica interna para establecer la conexión Socket.io
   */
  private attemptConnection(): void {
    if (!this.currentToken || this.isManuallyDisconnected) {
      return;
    }

    console.log(`🔌 [Socket] Conectando (Intento ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);

    this.socket = io(WS_URL, {
      query: { token: this.currentToken },
      transports: ['websocket', 'polling'],
      reconnection: false, // Manejamos la reconexión manualmente para más control
      timeout: 10000,
      autoConnect: true,
    });

    // ─── EVENTOS DEL SISTEMA ───

    this.socket.on('connect', () => {
      console.log('✅ [Socket] Conectado exitosamente ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Iniciar monitoreo de latencia
      this.startHealthCheck();
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ [Socket] Desconectado:', reason);
      this.stopHealthCheck();
      
      if (!this.isManuallyDisconnected) {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ [Socket] Error de conexión:', error.message);
      this.scheduleReconnect();
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('❌ [Socket] Error general:', error.message);
    });

    this.socket.on('forceDisconnect', ({ reason }: { reason: string }) => {
      console.log('🚫 [Socket] Desconexión forzada por servidor:', reason);
      this.isManuallyDisconnected = true;
      this.disconnect();
    });

    // ─── MANEJO CENTRALIZADO DE EVENTOS (LA SOLUCIÓN CLAVE) ───
    
    // Captura CUALQUIER evento que llegue del backend
    this.socket.onAny((event, ...args) => {
      // console.log(`📨 [Socket] Evento recibido: ${event}`, args); // Descomentar para debug agresivo
      
      // Si tenemos listeners registrados para este evento en nuestro mapa, los ejecutamos.
      // Esto funciona aunque el listener se haya registrado ANTES de conectar.
      if (this.listeners.has(event)) {
        this.listeners.get(event)!.forEach((callback) => {
          try {
            callback(args[0]);
          } catch (error) {
            console.error(`❌ Error en callback de '${event}':`, error);
          }
        });
      }
    });

    // Eventos específicos del sistema que requieren lógica extra
    this.socket.on('pong', (data: { timestamp: number }) => {
      this.handlePong(data.timestamp);
    });
  }

  /**
   * Registra un listener para un evento.
   * Se guarda en memoria, por lo que funciona offline/online.
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // Log de debug para confirmar registro
    if (!this.socket?.connected) {
      console.log(`⏳ [Socket] Listener guardado en espera para: ${event}`);
    }
  }

  /**
   * Elimina un listener.
   */
  off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emite un evento al servidor.
   */
  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ [Socket] No se pudo emitir '${event}': Desconectado`);
    }
  }

  /**
   * Métodos de Suscripción a Canales
   */
  subscribe(channel: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe', { channel });
    }
  }

  unsubscribe(channel: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe', { channel });
    }
  }

  // ─── LÓGICA DE RECONEXIÓN Y HEALTH CHECK ───

  private scheduleReconnect(): void {
    if (this.isManuallyDisconnected || this.reconnectTimer) return;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      return;
    }

    // Backoff exponencial para no saturar
    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts),
      30000
    );

    console.log(`⏳ Reconexión programada en ${delay}ms...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      
      // Limpieza total antes de reintentar
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.close();
        this.socket = null;
      }

      this.attemptConnection();
    }, delay);
  }

  disconnect(): void {
    console.log('🔌 Desconectando socket manualmente');
    this.isManuallyDisconnected = true;
    this.stopHealthCheck();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Limpiamos los listeners para evitar fugas de memoria al cerrar sesión
    this.listeners.clear();
    this.currentToken = null;
    this.reconnectAttempts = 0;
    this.resetLatencyMetrics();
  }

  // ─── PING / PONG Y MÉTRICAS ───

  private startHealthCheck(): void {
    this.stopHealthCheck();
    this.sendPing();
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, this.PING_INTERVAL);
  }

  private stopHealthCheck(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendPing(): void {
    if (this.socket?.connected) {
      this.lastPingTimestamp = Date.now();
      this.socket.emit('ping');
    }
  }

  ping(): void {
    this.sendPing();
  }

  private handlePong(serverTimestamp: number): void {
    const now = Date.now();
    const latency = now - this.lastPingTimestamp;

    this.latencyMetrics.current = latency;
    this.latencyMetrics.samples.push(latency);

    if (this.latencyMetrics.samples.length > this.MAX_SAMPLES) {
      this.latencyMetrics.samples.shift();
    }

    this.latencyMetrics.min = Math.min(...this.latencyMetrics.samples);
    this.latencyMetrics.max = Math.max(...this.latencyMetrics.samples);
    this.latencyMetrics.average =
      this.latencyMetrics.samples.reduce((a, b) => a + b, 0) /
      this.latencyMetrics.samples.length;

    // Disparamos evento interno de actualización de latencia
    this.dispatchInternalEvent('latencyUpdate', this.latencyMetrics);
  }

  private dispatchInternalEvent(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(cb => cb(data));
    }
  }

  private resetLatencyMetrics(): void {
    this.latencyMetrics = {
      current: 0,
      average: 0,
      min: Infinity,
      max: 0,
      samples: [],
    };
  }

  // Getters y Utilidades
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  getLatencyMetrics(): LatencyMetrics {
    return { ...this.latencyMetrics };
  }

  forceReconnect(): void {
    console.log('🔄 Forzando reconexión...');
    this.disconnect(); // Limpia todo
    this.isManuallyDisconnected = false; // Permite reconectar
    if (this.currentToken) {
      this.attemptConnection();
    }
  }
}

// Exportamos una única instancia (Singleton) para toda la app
export const socketClient = new SocketClient();