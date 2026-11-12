import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificacionesService } from './notificaciones.service';

export interface Medicamento {
  id: string;
  nombre: string;
  tipo?: string;
  dosis: string;
  frecuencia: string;
  frecuenciaHoras?: number;
  fechaInicio: string;
  duracion: string;
  horaInicio?: string;
  stockRestante: number;
  stockUnidad?: string;
  imagenUrl?: string;
  tomadoHoy?: boolean;
  tratamientoTerminado?: boolean;
  fechaFinTratamiento?: string;
}

const STORAGE_KEY = 'doxidetect_medicamentos_v2';
const FECHA_HOY_KEY = 'doxidetect_fecha_hoy_v2';

@Injectable({
  providedIn: 'root',
})
export class MedicamentosService {
  private readonly medicamentosPorDefecto: Medicamento[] = [
    {
      id: '1',
      nombre: 'Paracetamol',
      tipo: 'Tableta',
      dosis: '500 mg · 1 tableta',
      frecuencia: 'Cada 8 horas',
      fechaInicio: '2026-11-08',
      duracion: '5 días',
      horaInicio: '08:00 AM',
      stockRestante: 14,
      stockUnidad: 'tabletas',
      imagenUrl: '',
      tomadoHoy: true,
    },
    {
      id: '2',
      nombre: 'Amoxicilina',
      tipo: 'Cápsula',
      dosis: '500 mg · 1 cápsula',
      frecuencia: 'Cada 12 horas',
      fechaInicio: '2026-11-07',
      duracion: '7 días',
      horaInicio: '12:00 PM',
      stockRestante: 6,
      stockUnidad: 'cápsulas',
      imagenUrl: '',
      tomadoHoy: false,
    },
    {
      id: '3',
      nombre: 'Ibuprofeno',
      tipo: 'Tableta',
      dosis: '400 mg · 1 tableta',
      frecuencia: 'Cada 8 horas',
      fechaInicio: '2026-11-09',
      duracion: '3 días',
      horaInicio: '04:00 PM',
      stockRestante: 3,
      stockUnidad: 'tabletas',
      imagenUrl: '',
      tomadoHoy: false,
    },
    {
      id: '4',
      nombre: 'Loratadina',
      tipo: 'Tableta',
      dosis: '10 mg · 1 tableta',
      frecuencia: 'Cada 24 horas',
      fechaInicio: '2026-11-01',
      duracion: '15 días',
      horaInicio: '09:00 PM',
      stockRestante: 20,
      stockUnidad: 'tabletas',
      imagenUrl: '',
      tomadoHoy: false,
    },
  ];

  // Lista en memoria inicializada DE INMEDIATO (síncrona) para evitar pantallas vacías o doble clic
  private medicamentos: Medicamento[] = this.cargarInicialSincrono();
  private medicamentos$ = new BehaviorSubject<Medicamento[]>(this.medicamentos);

  constructor(private notificacionesService: NotificacionesService) {
    // Sincronizar en segundo plano con Preferences de Capacitor si existe
    this.sincronizarConPreferences();
  }

  // Carga síncrona instantánea desde localStorage
  private cargarInicialSincrono(): Medicamento[] {
    try {
      const hoyStr = new Date().toISOString().split('T')[0];
      const ultimaFecha = localStorage.getItem(FECHA_HOY_KEY);
      const guardado = localStorage.getItem(STORAGE_KEY);

      let lista: Medicamento[] = [];

      if (guardado) {
        lista = JSON.parse(guardado);
      } else {
        lista = [...this.medicamentosPorDefecto];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
        localStorage.setItem(FECHA_HOY_KEY, hoyStr);
      }

      // Si cambió el día, resetear los checkboxes para el nuevo día
      if (ultimaFecha !== hoyStr) {
        localStorage.setItem(FECHA_HOY_KEY, hoyStr);
        if (ultimaFecha) {
          lista = lista.map((m) => ({ ...m, tomadoHoy: false }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
        }
      }

      return lista;
    } catch {
      return [...this.medicamentosPorDefecto];
    }
  }

  // Sincronización en segundo plano con Preferences de Capacitor
  private async sincronizarConPreferences(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (value) {
        const listaCap = JSON.parse(value);
        if (Array.isArray(listaCap) && listaCap.length > 0) {
          this.medicamentos = listaCap;
          this.medicamentos$.next([...this.medicamentos]);
        }
      } else {
        await Preferences.set({
          key: STORAGE_KEY,
          value: JSON.stringify(this.medicamentos),
        });
      }
    } catch {
      // Ignorar en entorno web puro
    }
  }

  // Retorna la lista inmediatamente de forma síncrona
  getMedicamentos(): Medicamento[] {
    return [...this.medicamentos];
  }

  // Retorna las tomas de hoy de forma síncrona (solo medicamentos con tratamiento ACTIVO)
  getTomasDeHoy(): Medicamento[] {
    return this.medicamentos.filter((m) => !m.tratamientoTerminado);
  }

  // Observable reactivo
  obtenerMedicamentos$(): Observable<Medicamento[]> {
    return this.medicamentos$.asObservable();
  }

  getMedicamentoPorId(id: string): Medicamento | undefined {
    return this.medicamentos.find((m) => m.id === id);
  }

  // Agregar medicamento
  agregarMedicamento(nuevo: Omit<Medicamento, 'id'>): Medicamento {
    const nuevoMed: Medicamento = {
      ...nuevo,
      id: Date.now().toString(),
      tomadoHoy: false,
    };

    this.medicamentos = [nuevoMed, ...this.medicamentos];
    this.guardarYNotificar();
    return nuevoMed;
  }

  // Actualizar medicamento
  actualizarMedicamento(id: string, datos: Partial<Medicamento>): boolean {
    const index = this.medicamentos.findIndex((m) => m.id === id);
    if (index !== -1) {
      this.medicamentos[index] = {
        ...this.medicamentos[index],
        ...datos,
      };
      this.guardarYNotificar();
      return true;
    }
    return false;
  }

  // Alternar estado tomado de hoy
  toggleTomado(id: string): boolean {
    const med = this.medicamentos.find((m) => m.id === id);
    if (med) {
      med.tomadoHoy = !med.tomadoHoy;
      this.guardarYNotificar();
      return true;
    }
    return false;
  }

  // Termina el tratamiento: ya no saldrá en las tomas de hoy, pero se conserva en el botiquín/historial
  terminarTratamiento(id: string): boolean {
    const med = this.medicamentos.find((m) => m.id === id);
    if (med) {
      med.tratamientoTerminado = true;
      med.fechaFinTratamiento = new Date().toISOString();
      this.guardarYNotificar();
      // Cancelar notificaciones pendientes
      this.notificacionesService.cancelarNotificacionesMedicamento(id);
      return true;
    }
    return false;
  }

  // Reactivar tratamiento si el usuario lo necesita de nuevo
  reactivarTratamiento(id: string): boolean {
    const med = this.medicamentos.find((m) => m.id === id);
    if (med) {
      med.tratamientoTerminado = false;
      med.tomadoHoy = false;
      med.fechaFinTratamiento = undefined;
      this.guardarYNotificar();
      return true;
    }
    return false;
  }

  // Comprueba si ya transcurrió la duración del tratamiento establecida
  esDuracionCumplida(med: Medicamento): boolean {
    if (!med.fechaInicio || !med.duracion) return false;
    try {
      const match = med.duracion.match(/(\d+)/);
      if (!match) return false;
      let dias = parseInt(match[1], 10);
      if (med.duracion.toLowerCase().includes('semana')) {
        dias = dias * 7;
      } else if (med.duracion.toLowerCase().includes('mes')) {
        dias = dias * 30;
      }

      const partes = med.fechaInicio.split('-');
      if (partes.length !== 3) return false;
      const fInicio = new Date(
        parseInt(partes[0], 10),
        parseInt(partes[1], 10) - 1,
        parseInt(partes[2], 10)
      );

      const hoy = new Date();
      // Eliminar horas para comparar solo fechas
      hoy.setHours(0, 0, 0, 0);
      fInicio.setHours(0, 0, 0, 0);

      const fFin = new Date(fInicio.getTime() + dias * 24 * 60 * 60 * 1000);
      return hoy.getTime() >= fFin.getTime();
    } catch {
      return false;
    }
  }

  // Eliminar medicamento
  eliminarMedicamento(id: string): boolean {
    const index = this.medicamentos.findIndex((m) => m.id === id);
    if (index !== -1) {
      this.medicamentos.splice(index, 1);
      this.guardarYNotificar();
      // Cancelar notificaciones programadas para este medicamento
      this.notificacionesService.cancelarNotificacionesMedicamento(id);
      return true;
    }
    return false;
  }

  // Guarda síncronamente en localStorage y en Preferences en segundo plano
  private guardarYNotificar(): void {
    const copia = [...this.medicamentos];
    this.medicamentos$.next(copia);

    // 1. Inmediato y síncrono (0ms)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copia));
    } catch {}

    // 2. Persistencia nativa Capacitor en segundo plano
    Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(copia),
    }).catch(() => {});
  }
}
