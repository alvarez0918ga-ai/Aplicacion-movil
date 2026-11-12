import { Injectable } from '@angular/core';
import { LocalNotifications, PendingResult } from '@capacitor/local-notifications';
import { Medicamento } from './medicamentos.service';
import { SonidosService } from './sonidos.service';

export interface InfoNotificacionProgramada {
  id: number;
  titulo: string;
  mensaje: string;
  fecha: Date;
  tipo: '10_min_antes' | 'momento_exacto';
  medicamentoNombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificacionesService {
  readonly CANAL_ID = 'recordatorios_medicamentos_v2';
  private canalInicializado = false;

  constructor(private sonidosService: SonidosService) {
    this.inicializarCanal();
    this.escucharNotificaciones();
  }

  /**
   * Escucha notificaciones mientras la app está abierta para asegurar que el sonido suene
   */
  private escucharNotificaciones(): void {
    try {
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('Notificación recibida:', notification);
        this.sonidosService.reproducirTono();
      });
    } catch {}
  }

  /**
   * Crea el canal de notificación con máxima prioridad en Android (sonido, vibración, luces)
   */
  async inicializarCanal(): Promise<void> {
    try {
      // Eliminar el canal anterior que pudo quedar sin sonido en el sistema
      try {
        await LocalNotifications.deleteChannel({ id: 'recordatorios_medicamentos' });
      } catch {}

      await LocalNotifications.createChannel({
        id: this.CANAL_ID,
        name: 'Recordatorios de Medicamentos',
        description: 'Notificaciones con sonido y vibración para tus tomas',
        importance: 5, // 5 = IMPORTANCE_HIGH (muestra alerta flotante y emite sonido)
        visibility: 1, // Visible en pantalla de bloqueo
        sound: 'beep.wav',
        vibration: true,
        lights: true,
        lightColor: '#2563eb',
      });
      this.canalInicializado = true;
    } catch {
      // Ignorar en navegadores web donde createChannel no aplica
    }
  }

  /**
   * Solicita o comprueba permisos de notificación tanto en móvil como en navegador web
   */
  async solicitarPermisos(): Promise<boolean> {
    try {
      // 1. En entorno de navegador Web (Desktop / Chrome / Edge)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          try {
            await Notification.requestPermission();
          } catch {}
        }
      }

      // 2. En entorno Capacitor (Android / iOS)
      try {
        const estadoActual = await LocalNotifications.checkPermissions();
        if (estadoActual.display === 'granted') {
          return true;
        }
        const nuevoEstado = await LocalNotifications.requestPermissions();
        return nuevoEstado.display === 'granted';
      } catch {
        // En navegador web puro checkPermissions puede fallar
        return (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted');
      }
    } catch (e) {
      console.warn('Permisos de notificación:', e);
      return false;
    }
  }

  /**
   * Programa las notificaciones automáticas:
   * 1. Notificación 10 minutos antes de la toma.
   * 2. Notificación al momento exacto de la toma.
   * Calculadas a partir de la fecha de inicio, hora de toma y la frecuencia en horas (3, 4, 6, 8, 12 o 24).
   */
  async programarNotificacionesMedicamento(
    med: Medicamento,
    frecuenciaHoras: number,
    diasTratamiento: number = 7
  ): Promise<{ programadas: number; fechasTomas: Date[] }> {
    await this.solicitarPermisos();

    if (!this.canalInicializado) {
      await this.inicializarCanal();
    }

    // Cancelar recordatorios previos de este medicamento para evitar duplicados
    await this.cancelarNotificacionesMedicamento(med.id);

    // Calcular las tomas según horaInicio y frecuenciaHoras
    const fechasTomas = this.calcularHorariosTomas(
      med.fechaInicio,
      med.horaInicio || '08:00',
      frecuenciaHoras,
      diasTratamiento
    );

    const ahora = new Date();
    const notificaciones: any[] = [];
    const baseId = this.generarBaseId(med.id);

    fechasTomas.forEach((fechaToma, index) => {
      const fecha10MinAntes = new Date(fechaToma.getTime() - 10 * 60 * 1000);
      const horaFormateada = this.formatearHora(fechaToma);

      // 1. Notificación 10 minutos antes (solo si aún está en el futuro)
      if (fecha10MinAntes.getTime() > ahora.getTime()) {
        const id10Min = baseId + index * 2 + 1;
        notificaciones.push({
          id: id10Min,
          title: `⏰ En 10 minutos: ${med.nombre}`,
          body: `Tu toma de ${med.nombre} (${med.dosis || '1 dosis'}) es en 10 minutos (${horaFormateada}).`,
          channelId: this.CANAL_ID,
          sound: 'beep.wav',
          schedule: { at: fecha10MinAntes, allowWhileIdle: true },
          extra: {
            medId: med.id,
            tipo: '10_min_antes',
            toma: fechaToma.toISOString(),
          },
        });
      }

      // 2. Notificación al momento exacto (solo si aún está en el futuro)
      if (fechaToma.getTime() > ahora.getTime()) {
        const idExacto = baseId + index * 2 + 2;
        notificaciones.push({
          id: idExacto,
          title: `💊 ¡Hora de tu medicamento!`,
          body: `Es momento exacto de tomar ${med.nombre} (${med.dosis || '1 dosis'}).`,
          channelId: this.CANAL_ID,
          sound: 'beep.wav',
          schedule: { at: fechaToma, allowWhileIdle: true },
          extra: {
            medId: med.id,
            tipo: 'momento_exacto',
            toma: fechaToma.toISOString(),
          },
        });
      }
    });

    if (notificaciones.length > 0) {
      try {
        await LocalNotifications.schedule({
          notifications: notificaciones,
        });
        console.log(`Programadas ${notificaciones.length} notificaciones para ${med.nombre}`);
      } catch (err) {
        console.warn('Error al programar en LocalNotifications:', err);
      }
    }

    return {
      programadas: notificaciones.length,
      fechasTomas,
    };
  }

  /**
   * Cancela las notificaciones asociadas a un medicamento específico
   */
  async cancelarNotificacionesMedicamento(medId: string): Promise<void> {
    try {
      const pendientes: PendingResult = await LocalNotifications.getPending();
      const aEliminar = pendientes.notifications.filter(
        (n) => n.extra?.medId === medId
      );
      if (aEliminar.length > 0) {
        await LocalNotifications.cancel({
          notifications: aEliminar.map((n) => ({ id: n.id })),
        });
        console.log(`Canceladas ${aEliminar.length} notificaciones de medicamento ${medId}`);
      }
    } catch {
      // Ignorar en entorno web
    }
  }

  /**
   * Retorna las notificaciones actualmente pendientes
   */
  async obtenerPendientes(): Promise<PendingResult> {
    try {
      return await LocalNotifications.getPending();
    } catch {
      return { notifications: [] };
    }
  }

  /**
   * Cancela todas las notificaciones pendientes de la app
   */
  async cancelarTodas(): Promise<void> {
    try {
      const pendientes = await LocalNotifications.getPending();
      if (pendientes.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pendientes.notifications.map((n) => ({ id: n.id })),
        });
      }
    } catch {}
  }

  /**
   * Dispara una notificación de prueba en N segundos para verificar permisos y sonido.
   * Funciona tanto en móvil (Android/iOS) como en navegador web (Chrome/Edge).
   */
  async dispararNotificacionPrueba(segundos: number = 3): Promise<void> {
    await this.solicitarPermisos();
    if (!this.canalInicializado) {
      await this.inicializarCanal();
    }

    // Reproducir tono seleccionado
    this.sonidosService.reproducirTono();

    const fechaPrueba = new Date(Date.now() + segundos * 1000);

    // 1. En Capacitor Móvil
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 99999,
            title: '🔔 Recordatorio de Medicamento',
            body: '¡Notificación de prueba exitosa! El sonido y las alertas están funcionando.',
            channelId: this.CANAL_ID,
            sound: 'beep.wav',
            schedule: { at: fechaPrueba, allowWhileIdle: true },
          },
        ],
      });
    } catch (e) {
      console.warn('Aviso Capacitor:', e);
    }

    // 2. Disparo en Navegador Web (si se prueba desde PC o navegador)
    setTimeout(() => {
      this.sonidosService.reproducirTono();
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('🔔 Recordatorio de Medicamento', {
            body: '¡Notificación de prueba exitosa! El sonido y las alertas están activos.',
            icon: 'assets/icon/favicon.png',
          });
        } catch {}
      }
    }, segundos * 1000);
  }

  /**
   * Algoritmo de cálculo de tomas:
   * A partir de la fecha de inicio, la hora de toma y el intervalo de frecuencia (3, 4, 6, 8, 12, 24 horas),
   * genera el listado de momentos de toma futuros.
   */
  calcularHorariosTomas(
    fechaInicioStr: string,
    horaInicioStr: string,
    frecuenciaHoras: number,
    diasTratamiento: number = 7
  ): Date[] {
    const fechas: Date[] = [];
    const intervaloHoras = Number(frecuenciaHoras) > 0 ? Number(frecuenciaHoras) : 8;

    // 1. Parsear fecha de inicio
    let year = new Date().getFullYear();
    let month = new Date().getMonth();
    let day = new Date().getDate();

    if (fechaInicioStr) {
      const partes = fechaInicioStr.split('-');
      if (partes.length === 3) {
        year = parseInt(partes[0], 10);
        month = parseInt(partes[1], 10) - 1;
        day = parseInt(partes[2], 10);
      }
    }

    // 2. Parsear hora de toma (soporta 24h "HH:mm" o "hh:mm AM/PM")
    let hours = 8;
    let minutes = 0;
    if (horaInicioStr) {
      const match = horaInicioStr.match(/(\d{1,2}):(\d{2})(?:\s*([AP]M))?/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const ampm = match[3]?.toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      }
    }

    const primerToma = new Date(year, month, day, hours, minutes, 0, 0);
    const ahora = new Date();

    // 3. Ajustar el cursor al primer horario que no haya vencido aún
    let cursor = new Date(primerToma.getTime());
    while (cursor.getTime() < ahora.getTime() - 10 * 60 * 1000) {
      cursor = new Date(cursor.getTime() + intervaloHoras * 60 * 60 * 1000);
    }

    // 4. Generar tomas para los días del tratamiento (límite para no saturar memoria del sistema)
    const duracion = Math.max(1, Math.min(diasTratamiento || 7, 14));
    const tomasPorDia = 24 / intervaloHoras;
    const maxTomas = Math.min(Math.ceil(duracion * tomasPorDia), 32);

    for (let i = 0; i < maxTomas; i++) {
      fechas.push(new Date(cursor.getTime() + i * intervaloHoras * 60 * 60 * 1000));
    }

    return fechas;
  }

  /**
   * Genera una base de ID numérica determinista y segura para 32-bit integer
   */
  private generarBaseId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const num = Math.abs(hash) % 10000;
    return (num + 1) * 100;
  }

  private formatearHora(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
