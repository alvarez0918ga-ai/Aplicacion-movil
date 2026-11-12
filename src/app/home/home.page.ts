import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Medicamento, MedicamentosService } from '../services/medicamentos.service';

export interface TabNav {
  id: string;
  etiqueta: string;
  icono?: string;
  tipo?: 'icono' | 'capsula' | 'robot';
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  fechaHoy = 'lunes, 9 de noviembre de 2026';
  medicamentos: Medicamento[] = [];

  tabs: TabNav[] = [
    { id: 'hoy', etiqueta: 'Hoy', icono: 'time-outline', tipo: 'icono' },
    { id: 'medicamentos', etiqueta: 'Medicamentos', icono: 'medkit-outline', tipo: 'icono' },
    { id: 'soporte', etiqueta: 'IA / Soporte', tipo: 'robot' },
    { id: 'perfil', etiqueta: 'Perfil', icono: 'person-outline', tipo: 'icono' },
  ];

  tabActivo = 'hoy';

  constructor(
    private router: Router,
    private medicamentosService: MedicamentosService,
    private alertController: AlertController,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    // Inicialización inmediata para que aparezcan al primer clic
    this.medicamentos = this.medicamentosService.getTomasDeHoy();
  }

  ngOnInit() {
    this.formatearFecha();
    this.cargarMedicamentos();
  }

  ionViewWillEnter() {
    this.tabActivo = 'hoy';
    this.cargarMedicamentos();
  }

  cargarMedicamentos() {
    this.medicamentos = this.medicamentosService.getTomasDeHoy();
    this.cdr.detectChanges();
  }

  formatearFecha() {
    try {
      const hoy = new Date();
      const opciones: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      this.fechaHoy = hoy.toLocaleDateString('es-ES', opciones);
    } catch {
      this.fechaHoy = 'lunes, 9 de noviembre de 2026';
    }
  }

  get completadas(): number {
    return this.medicamentos.filter((m) => m.tomadoHoy).length;
  }

  get pendientes(): Medicamento[] {
    return this.medicamentos.filter((m) => !m.tomadoHoy);
  }

  get completados(): Medicamento[] {
    return this.medicamentos.filter((m) => m.tomadoHoy);
  }

  toggleTomado(med: Medicamento) {
    this.medicamentosService.toggleTomado(med.id);
    this.cargarMedicamentos();
  }

  duracionCumplida(med: Medicamento): boolean {
    return this.medicamentosService.esDuracionCumplida(med);
  }

  // Calcula y formatea la hora exacta de la toma actual o próxima de hoy
  formatearHoraToma(med: Medicamento): string {
    if (!med.horaInicio) return '08:00 AM';

    const frecuencia = med.frecuenciaHoras || 8;
    if (frecuencia >= 24) {
      return this.convertirHora12(med.horaInicio);
    }

    const [h, m] = med.horaInicio.split(':').map(Number);
    const ahora = new Date();
    const ahoraMinutos = ahora.getHours() * 60 + ahora.getMinutes();

    let inicioMinutos = (h || 8) * 60 + (m || 0);
    while (inicioMinutos >= frecuencia * 60) {
      inicioMinutos -= frecuencia * 60;
    }

    const tomasDelDia: number[] = [];
    let cursor = inicioMinutos;
    while (cursor < 24 * 60) {
      tomasDelDia.push(cursor);
      cursor += frecuencia * 60;
    }

    if (!med.tomadoHoy) {
      const tomaCercana = tomasDelDia.find((min) => min >= ahoraMinutos - 30);
      if (tomaCercana !== undefined) {
        return this.minutosAHora12(tomaCercana);
      }
    }

    return this.convertirHora12(med.horaInicio);
  }

  private convertirHora12(horaStr: string): string {
    if (!horaStr) return '08:00 AM';
    if (horaStr.includes('AM') || horaStr.includes('PM') || horaStr.includes('a. m.') || horaStr.includes('p. m.')) {
      return horaStr;
    }
    const [h, m] = horaStr.split(':').map(Number);
    const horas = h || 0;
    const minutos = String(m || 0).padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const h12 = horas % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${minutos} ${ampm}`;
  }

  private minutosAHora12(totalMinutos: number): string {
    const horas = Math.floor(totalMinutos / 60) % 24;
    const minutos = totalMinutos % 60;
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const h12 = horas % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(minutos).padStart(2, '0')} ${ampm}`;
  }

  async confirmarTerminarTratamiento(med: Medicamento, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const alert = await this.alertController.create({
      header: 'Terminar tratamiento',
      subHeader: med.nombre,
      message: `¿Deseas dar por finalizado este tratamiento?
      <br><br>
      • Ya <strong>no saldrá</strong> en las tomas diarias de <em>Hoy</em>.
      <br>• Se conservará guardado en tu historial de <em>Medicamentos</em>.
      <br>• Se cancelarán las notificaciones pendientes.`,
      buttons: [
        {
          text: 'Continuar tomando',
          role: 'cancel',
        },
        {
          text: 'Terminar tratamiento',
          role: 'destructive',
          handler: () => {
            this.medicamentosService.terminarTratamiento(med.id);
            this.cargarMedicamentos();
            this.mostrarToast(`Tratamiento de ${med.nombre} finalizado y archivado en tu historial`);
          },
        },
      ],
    });

    await alert.present();
  }

  async mostrarToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color: 'dark',
    });
    await toast.present();
  }

  irA(id: string) {
    this.tabActivo = id;
    if (id === 'hoy') {
      this.router.navigate(['/home']);
    } else if (id === 'medicamentos') {
      this.router.navigate(['/medicamentos']);
    } else if (id === 'perfil') {
      this.router.navigate(['/perfil']);
    } else if (id === 'soporte') {
      console.log('Botón Asistente IA presionado');
    }
  }
}
