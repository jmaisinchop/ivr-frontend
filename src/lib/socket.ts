import { io, Socket } from 'socket.io-client';
import { DashboardUpdate } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

interface LatencyMetrics {
  current: number;
  average: number;
  min: number;
  max: number;
  samples: number[];
}

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;
  private currentToken: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManuallyDisconnected = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTimestamp = 0;
  private latencyMetrics: LatencyMetrics = {
    current: 0,
    average: 0,
    min: Infinity,
    max: 0,
    samples: [],
  };
  private readonly MAX_SAMPLES = 20; // Guardar últimas 20 mediciones
  private readonly PING_INTERVAL = 10000; // Ping cada 10 segundos

  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('✅ Socket ya está conectado');
      return;
    }

    this.currentToken = token;
    this.isManuallyDisconnected = false;
    this.attemptConnection();
  }

  private attemptConnection(): void {
    if (!this.currentToken || this.isManuallyDisconnected) {
      return;
    }

    console.log(`🔌 Intentando conectar WebSocket (intento ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);

    this.socket = io(WS_URL, {
      query: { token: this.currentToken },
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 10000,
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket conectado exitosamente');
      this.reconnectAttempts = 0;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Iniciar health check automático
      this.startHealthCheck();
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket desconectado:', reason);
      this.stopHealthCheck();
      
      if (!this.isManuallyDisconnected) {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Error de conexión:', error.message);
      this.scheduleReconnect();
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('❌ Socket error:', error.message);
    });

    this.socket.on('forceDisconnect', ({ reason }: { reason: string }) => {
      console.log('🚫 Desconexión forzada:', reason);
      this.isManuallyDisconnected = true;
      this.disconnect();
    });

    this.socket.on('dashboardUpdate', (data: DashboardUpdate) => {
      console.log('📊 Dashboard update:', data.event);
      this.emit('dashboardUpdate', data);
    });

    this.socket.on('adminUpdate', (data: any) => {
      console.log('👑 Admin update:', data);
      this.emit('adminUpdate', data);
    });

    this.socket.on('pong', (data: { timestamp: number }) => {
      this.handlePong(data.timestamp);
    });

    this.socket.on('subscribed', (data: { channel: string; room: string }) => {
      console.log('✅ Suscrito a:', data.channel);
    });

    this.socket.on('unsubscribed', (data: { channel: string }) => {
      console.log('❌ Desuscrito de:', data.channel);
    });
  }

  private startHealthCheck(): void {
    // Limpiar cualquier ping anterior
    this.stopHealthCheck();

    // Primer ping inmediato
    this.sendPing();

    // Pings periódicos
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
    if (!this.socket?.connected) {
      return;
    }

    this.lastPingTimestamp = Date.now();
    this.socket.emit('ping');
  }

  private handlePong(serverTimestamp: number): void {
    const now = Date.now();
    const latency = now - this.lastPingTimestamp;

    // Actualizar métricas
    this.latencyMetrics.current = latency;
    this.latencyMetrics.samples.push(latency);

    // Mantener solo las últimas N muestras
    if (this.latencyMetrics.samples.length > this.MAX_SAMPLES) {
      this.latencyMetrics.samples.shift();
    }

    // Calcular estadísticas
    this.latencyMetrics.min = Math.min(...this.latencyMetrics.samples);
    this.latencyMetrics.max = Math.max(...this.latencyMetrics.samples);
    this.latencyMetrics.average =
      this.latencyMetrics.samples.reduce((a, b) => a + b, 0) /
      this.latencyMetrics.samples.length;

    console.log(`🏓 Pong recibido - Latencia: ${latency}ms (avg: ${this.latencyMetrics.average.toFixed(0)}ms)`);

    // Emitir evento de latencia actualizada
    this.emit('latencyUpdate', this.latencyMetrics);
  }

  private scheduleReconnect(): void {
    if (this.isManuallyDisconnected) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      this.emit('maxReconnectAttemptsReached', {});
      return;
    }

    if (this.reconnectTimer) {
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts),
      30000
    );

    console.log(`⏳ Programando reconexión en ${delay}ms...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      
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

    this.listeners.clear();
    this.currentToken = null;
    this.reconnectAttempts = 0;
    this.resetLatencyMetrics();
  }

  subscribe(channel: string): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket no conectado, no se puede suscribir a:', channel);
      return;
    }
    this.socket.emit('subscribe', { channel });
  }

  unsubscribe(channel: string): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('unsubscribe', { channel });
  }

  ping(): void {
    this.sendPing();
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Error en listener:', error);
      }
    });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  getLatencyMetrics(): LatencyMetrics {
    return { ...this.latencyMetrics };
  }

  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
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

  forceReconnect(): void {
    console.log('🔄 Forzando reconexión...');
    this.reconnectAttempts = 0;
    
    this.stopHealthCheck();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }

    if (this.currentToken) {
      this.attemptConnection();
    }
  }
}

export const socketClient = new SocketClient();