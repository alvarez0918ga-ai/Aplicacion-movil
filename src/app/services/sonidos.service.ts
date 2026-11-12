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
  private readonly AUDIO_CUSTOM_KEY = 'doxidetect_audio_personalizado';

  // Tonos predeterminados disponibles
  tonosDisponibles = [
    { id: 'campana', nombre: 'Campana suave (Chime)' },
    { id: 'alarma', nombre: 'Alarma médica (Beep)' },
    { id: 'digital', nombre: 'Tono digital' },
    { id: 'silencio', nombre: 'Solo vibración (Silencioso)' },
  ];

  // Obtiene el tono guardado (o 'campana' por defecto)
  obtenerTonoActual(): string {
    return localStorage.getItem(this.SONIDO_KEY) || 'campana';
  }

  guardarTono(tonoId: string): void {
    localStorage.setItem(this.SONIDO_KEY, tonoId);
  }

  // Guarda un archivo de audio importado en Base64
  guardarAudioPersonalizado(nombre: string, base64: string): void {
    const obj: InfoAudioPersonalizado = { nombre, data: base64 };
    localStorage.setItem(this.AUDIO_CUSTOM_KEY, JSON.stringify(obj));
    this.guardarTono('personalizado');
  }

  obtenerAudioPersonalizado(): InfoAudioPersonalizado | null {
    try {
      const guardado = localStorage.getItem(this.AUDIO_CUSTOM_KEY);
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  }

  // Reproduce el tono actual o el especificado
  reproducirTono(tipo?: string): void {
    const tono = tipo || this.obtenerTonoActual();

    if (tono === 'silencio') {
      return;
    }

    // Si es un audio personalizado subido por el usuario
    if (tono === 'personalizado') {
      const custom = this.obtenerAudioPersonalizado();
      if (custom?.data) {
        const audio = new Audio(custom.data);
        audio.play().catch((err) => console.warn('Error al reproducir audio personalizado:', err));
        return;
      }
    }

    // Tono sintetizado nativo mediante Web Audio API (compatible en todos los dispositivos)
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

