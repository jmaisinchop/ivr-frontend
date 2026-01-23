import { io, Socket } from 'socket.io-client';
import { DashboardUpdate } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
    });

    this.socket.on('forceDisconnect', ({ reason }: { reason: string }) => {
      console.log('Force disconnect:', reason);
      this.disconnect();
    });

    this.socket.on('dashboardUpdate', (data: DashboardUpdate) => {
      this.emit('dashboardUpdate', data);
    });

    this.socket.on('adminUpdate', (data: any) => {
      this.emit('adminUpdate', data);
    });

    this.socket.on('pong', (data: { timestamp: number }) => {
      this.emit('pong', data);
    });

    this.socket.on('subscribed', (data: { channel: string; room: string }) => {
      console.log('Subscribed to:', data.channel);
    });

    this.socket.on('unsubscribed', (data: { channel: string }) => {
      console.log('Unsubscribed from:', data.channel);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  subscribe(channel: string): void {
    this.socket?.emit('subscribe', { channel });
  }

  unsubscribe(channel: string): void {
    this.socket?.emit('unsubscribe', { channel });
  }

  ping(): void {
    this.socket?.emit('ping');
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
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketClient = new SocketClient();
