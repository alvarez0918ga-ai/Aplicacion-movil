import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { MedicamentosService } from '../services/medicamentos.service';
import { NotificacionesService } from '../services/notificaciones.service';

@Component({
  selector: 'app-registrar-m',
  templateUrl: './registrarM.page.html',
  styleUrls: ['./registrarM.page.scss'],
  standalone: false,
})
export class RegistrarMPage implements OnInit {
  medicamento = {
    nombre: '',
    tipo: '',
    dosis: '',
    fechaInicio: '',
    horaInicio: '08:00',
    duracion: '',
    frecuencia: '',
    frecuenciaHoras: null as number | null,
    cantidadInicial: '',
    imagenUrl: '' as string | undefined,
  };

  tipoPersonalizado: string = '';

  // Lista de tipos de medicamentos
  tiposMedicamento: string[] = [
    'Pastilla',
    'Cápsula',
    'Tableta',
    'Jarabe',
    'Inyección',
    'Gotas',
    'Inhalador',
    'Pomada / Crema',
    'Suspensión',
    'Otro',
  ];

  // Opciones de frecuencia en horas
  opcionesFrecuencia = [
    { horas: 3, etiqueta: 'Cada 3 horas (8 tomas al día)' },
    { horas: 4, etiqueta: 'Cada 4 horas (6 tomas al día)' },
    { horas: 6, etiqueta: 'Cada 6 horas (4 tomas al día)' },
    { horas: 8, etiqueta: 'Cada 8 horas (3 tomas al día)' },
    { horas: 12, etiqueta: 'Cada 12 horas (2 tomas al día)' },
    { horas: 24, etiqueta: 'Cada 24 horas (1 toma al día)' },
  ];

  frecuenciaHorasSeleccionada: number | null = null;
  proximasTomasPreview: string[] = [];

  constructor(
    private router: Router,
    private medicamentosService: MedicamentosService,
    private notificacionesService: NotificacionesService
  ) {}

  ngOnInit() {
    // Inicializar fecha de hoy por defecto: YYYY-MM-DD
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    this.medicamento.fechaInicio = `${anio}-${mes}-${dia}`;
    this.medicamento.horaInicio = '08:00';
    this.medicamento.tipo = '';
  }

  seleccionarTipo(tipo: any) {
    this.medicamento.tipo = tipo;
    if (tipo !== 'Otro') {
      this.tipoPersonalizado = '';
    }
  }

  seleccionarFrecuencia(horas: any) {
    if (!horas) return;
    const num = Number(horas);
    this.frecuenciaHorasSeleccionada = num;
    this.medicamento.frecuenciaHoras = num;
    this.medicamento.frecuencia = `Cada ${num} horas`;
    this.recalcularTomasPreview();
  }

  alCambiarHoraInicio() {
    this.recalcularTomasPreview();
  }

  alCambiarFechaInicio() {
    this.recalcularTomasPreview();
  }

  recalcularTomasPreview() {
    if (!this.frecuenciaHorasSeleccionada || !this.medicamento.horaInicio) {
      this.proximasTomasPreview = [];
      return;
    }

    const tomas = this.notificacionesService.calcularHorariosTomas(
      this.medicamento.fechaInicio,
      this.medicamento.horaInicio,
      this.frecuenciaHorasSeleccionada,
      2
    );

    this.proximasTomasPreview = tomas.slice(0, 5).map((fecha) =>
      fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  }

  obtenerTipoFinal(): string {
    if (this.medicamento.tipo === 'Otro') {
      return this.tipoPersonalizado.trim() || 'Otro';
    }
    return this.medicamento.tipo ? this.medicamento.tipo.trim() : '';
  }

  // Tomar foto con cámara nativa usando Base64 según documentación de Ionic
  async tomarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      this.medicamento.imagenUrl = `data:image/${image.format || 'jpeg'};base64,${image.base64String}`;
    } catch (error) {
      console.log('Operación cancelada o error al capturar imagen:', error);
    }
  }

  // Subir foto desde la galería usando Base64
  async subirDeGaleria() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      this.medicamento.imagenUrl = `data:image/${image.format || 'jpeg'};base64,${image.base64String}`;
    } catch (error) {
      console.log('Operación cancelada o error al abrir galería:', error);
    }
  }

  eliminarFoto() {
    this.medicamento.imagenUrl = undefined;
  }

  async guardarMedicamento() {
    if (!this.medicamento.nombre.trim()) {
      alert('Por favor ingresa el nombre del medicamento.');
      return;
    }

    const tipoElegido = this.obtenerTipoFinal();
    if (!tipoElegido) {
      alert('Por favor selecciona el tipo de medicamento.');
      return;
    }

    if (!this.medicamento.horaInicio) {
      alert('Por favor indica la hora de inicio de la primera toma.');
      return;
    }

    if (!this.frecuenciaHorasSeleccionada) {
      alert('Por favor selecciona la frecuencia del medicamento (3, 4, 6, 8, 12 o 24 horas).');
      return;
    }

    const frecuenciaTexto = `Cada ${this.frecuenciaHorasSeleccionada} horas`;

    // 1. Guardar en el servicio
    const nuevoMed = this.medicamentosService.agregarMedicamento({
      nombre: this.medicamento.nombre.trim(),
      tipo: tipoElegido,
      dosis: this.medicamento.dosis.trim() || '1 dosis',
      frecuencia: frecuenciaTexto,
      frecuenciaHoras: this.frecuenciaHorasSeleccionada,
      fechaInicio: this.medicamento.fechaInicio || new Date().toISOString().split('T')[0],
      duracion: this.medicamento.duracion.trim() || '7 días',
      horaInicio: this.medicamento.horaInicio || '08:00',
      stockRestante: parseInt(this.medicamento.cantidadInicial, 10) || 10,
      stockUnidad: 'unidades',
      imagenUrl: this.medicamento.imagenUrl,
    });

    // 2. Programar notificaciones: 10 minutos antes y al momento exacto
    const diasTratamiento = this.extraerDias(this.medicamento.duracion);
    const resultado = await this.notificacionesService.programarNotificacionesMedicamento(
      nuevoMed,
      this.frecuenciaHorasSeleccionada,
      diasTratamiento
    );

    console.log('Medicamento guardado con éxito:', nuevoMed);
    console.log(`Notificaciones programadas: ${resultado.programadas}`);

    alert(
      `¡Medicamento guardado con éxito!\n\n` +
      `Se calcularon tus tomas cada ${this.frecuenciaHorasSeleccionada} horas desde las ${this.medicamento.horaInicio}.\n` +
      `Recibirás recordatorios:\n` +
      `• 10 minutos antes de cada toma\n` +
      `• Al momento exacto de cada toma`
    );

    this.router.navigate(['/medicamentos']);
  }

  private extraerDias(duracionStr: string): number {
    if (!duracionStr) return 7;
    const match = duracionStr.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (duracionStr.toLowerCase().includes('semana')) {
        return num * 7;
      }
      return num;
    }
    return 7;
  }
}
