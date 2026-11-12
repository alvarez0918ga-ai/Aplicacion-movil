import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificacionesService } from '../../services/notificaciones.service';
import { MedicamentosService } from '../../services/medicamentos.service';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.page.html',
  styleUrls: ['./notificaciones.page.scss'],
  standalone: false,
})
export class NotificacionesPage implements OnInit {
  nombreMed: string = '';
  horaMed: string = '08:00';
  tipoMed: string = '';
  frecuenciaHoras: number = 8;
  diasTratamiento: number = 7;

  opcionesFrecuencia = [
    { horas: 3, etiqueta: 'Cada 3 horas (8 tomas/día)' },
    { horas: 4, etiqueta: 'Cada 4 horas (6 tomas/día)' },
    { horas: 6, etiqueta: 'Cada 6 horas (4 tomas/día)' },
    { horas: 8, etiqueta: 'Cada 8 horas (3 tomas/día)' },
    { horas: 12, etiqueta: 'Cada 12 horas (2 tomas/día)' },
    { horas: 24, etiqueta: 'Cada 24 horas (1 toma/día)' },
  ];

  tiposMedicamento: string[] = [
    'Pastilla',
    'Cápsula',
    'Tableta',
    'Jarabe',
    'Inyección',
    'Gotas',
    'Inhalador',
    'Pomada / Crema',
  ];

  notificacionesPendientes: any[] = [];
  cargandoPendientes: boolean = false;

  constructor(
    private notificacionesService: NotificacionesService,
    private medicamentosService: MedicamentosService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarPendientes();
  }

  ionViewWillEnter() {
    this.cargarPendientes();
  }

  volver() {
    this.router.navigate(['/home']);
  }

  seleccionarFrecuencia(horas: number) {
    this.frecuenciaHoras = horas;
  }

  async cargarPendientes() {
    this.cargandoPendientes = true;
    try {
      const res = await this.notificacionesService.obtenerPendientes();
      this.notificacionesPendientes = res.notifications || [];
    } catch {
      this.notificacionesPendientes = [];
    } finally {
      this.cargandoPendientes = false;
    }
  }

  async programarRecordatorio(nombreMedicamento: string, horaSeleccionada: string) {
    if (!nombreMedicamento?.trim()) {
      alert('Por favor ingresa el nombre del medicamento');
      return;
    }

    if (!horaSeleccionada) {
      alert('Por favor selecciona la hora de inicio');
      return;
    }

    const hoyStr = new Date().toISOString().split('T')[0];

    const medDummy = {
      id: Date.now().toString(),
      nombre: nombreMedicamento.trim(),
      tipo: this.tipoMed || 'Medicamento',
      dosis: '1 dosis',
      frecuencia: `Cada ${this.frecuenciaHoras} horas`,
      frecuenciaHoras: this.frecuenciaHoras,
      fechaInicio: hoyStr,
      duracion: `${this.diasTratamiento} días`,
      horaInicio: horaSeleccionada,
      stockRestante: 10,
    };

    const res = await this.notificacionesService.programarNotificacionesMedicamento(
      medDummy,
      this.frecuenciaHoras,
      this.diasTratamiento
    );

    alert(
      `¡Notificaciones programadas con éxito!\n\n` +
      `Se crearon ${res.programadas} recordatorios:\n` +
      `• 10 minutos antes de cada toma\n` +
      `• Al momento exacto de cada toma\n\n` +
      `Calculadas cada ${this.frecuenciaHoras} horas a partir de las ${horaSeleccionada}.`
    );

    await this.cargarPendientes();
  }

  async probarNotificacion() {
    await this.notificacionesService.dispararNotificacionPrueba(3);
    alert('Notificación de prueba enviada. Aparecerá en tu pantalla en 3 segundos.');
  }

  async cancelarTodas() {
    if (confirm('¿Deseas cancelar todas las notificaciones pendientes?')) {
      await this.notificacionesService.cancelarTodas();
      await this.cargarPendientes();
      alert('Todas las notificaciones pendientes fueron canceladas.');
    }
  }

  formatearFechaNotif(at: any): string {
    if (!at) return '';
    try {
      const d = new Date(at);
      return d.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(at);
    }
  }
}
