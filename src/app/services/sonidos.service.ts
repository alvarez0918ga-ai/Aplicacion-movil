import { Injectable } from '@angular/core';

export interface InfoAudioPersonalizado {
  nombre: string;
  data: string; // Base64 Data URL
}

@Injectable({
  providedIn: 'root',
})
export class SonidosService {
  private readonly SONIDO_KEY = 'doxidetect_tono_notificacion';

  tonosDisponibles = [
    { id: 'campana', nombre: 'Campana suave' },
    { id: 'alarma', nombre: 'Alarma médica' },
    { id: 'digital', nombre: 'Tono digital' },
    { id: 'silencio', nombre: 'Solo vibración (Silencioso)' },
  ];


  obtenerTonoActual(): string {
    return localStorage.getItem(this.SONIDO_KEY) || 'campana';
  }

  guardarTono(tonoId: string): void {
    localStorage.setItem(this.SONIDO_KEY, tonoId);
  }


  reproducirTono(tipo?: string): void {
    const tono = tipo || this.obtenerTonoActual();

    if (tono === 'silencio') {
      return;
    }


    this.reproducirSintetizado(tono);
  }

  private reproducirSintetizado(tipo: string): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (tipo === 'alarma') {
        // Alarma médica (secuencia de beeps)
        this.emitirTono(ctx, 880, 0, 0.15, 'square');
        this.emitirTono(ctx, 880, 0.18, 0.15, 'square');
        this.emitirTono(ctx, 1174, 0.36, 0.25, 'sine');
      } else if (tipo === 'digital') {
        // Tono digital ascendente
        this.emitirTono(ctx, 523.25, 0, 0.1, 'sine');
        this.emitirTono(ctx, 659.25, 0.1, 0.1, 'sine');
        this.emitirTono(ctx, 783.99, 0.2, 0.25, 'triangle');
      } else {
        // 'campana' o por defecto: Chime melódico
        this.emitirTono(ctx, 659.25, 0, 0.4, 'triangle');
        this.emitirTono(ctx, 880, 0.15, 0.7, 'sine');
      }
    } catch (e) {
      console.warn('AudioContext no disponible o bloqueado:', e);
    }
  }

  private emitirTono(
    ctx: AudioContext,
    frecuencia: number,
    inicio: number,
    duracion: number,
    tipoOnda: OscillatorType = 'sine'
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = tipoOnda;
    osc.frequency.setValueAtTime(frecuencia, ctx.currentTime + inicio);

    gain.gain.setValueAtTime(0.3, ctx.currentTime + inicio);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + duracion);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + inicio);
    osc.stop(ctx.currentTime + inicio + duracion);
  }
}

