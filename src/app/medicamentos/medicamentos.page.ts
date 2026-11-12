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
  selector: 'app-medicamentos',
  templateUrl: './medicamentos.page.html',
  styleUrls: ['./medicamentos.page.scss'],
  standalone: false,
})
export class MedicamentosPage implements OnInit {
  medicamentos: Medicamento[] = [];
  medicamentosFiltrados: Medicamento[] = [];
  busqueda: string = '';
  filtroEstado: 'todos' | 'activos' | 'finalizados' = 'todos';

  tabs: TabNav[] = [
    { id: 'hoy', etiqueta: 'Hoy', icono: 'time-outline', tipo: 'icono' },
    { id: 'medicamentos', etiqueta: 'Medicamentos', icono: 'medkit-outline', tipo: 'icono' },
    { id: 'soporte', etiqueta: 'IA / Soporte', tipo: 'robot' },
    { id: 'perfil', etiqueta: 'Perfil', icono: 'person-outline', tipo: 'icono' },
  ];

  tabActivo: string = 'medicamentos';

  constructor(
    private medicamentosService: MedicamentosService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    // Inicialización inmediata para que aparezca al primer clic
    this.medicamentos = this.medicamentosService.getMedicamentos();
    this.filtrarMedicamentos();
  }

  ngOnInit() {
    this.cargarMedicamentos();
  }

  ionViewWillEnter() {
    this.tabActivo = 'medicamentos';
    this.cargarMedicamentos();
  }

  cargarMedicamentos() {
    this.medicamentos = this.medicamentosService.getMedicamentos();
    this.filtrarMedicamentos();
    this.cdr.detectChanges();
  }

  filtrarMedicamentos() {
    const query = this.busqueda.trim().toLowerCase();
    this.medicamentosFiltrados = this.medicamentos.filter((m) => {
      const coincideTexto =
        !query ||
        m.nombre.toLowerCase().includes(query) ||
        (m.tipo && m.tipo.toLowerCase().includes(query));

      if (!coincideTexto) return false;

      if (this.filtroEstado === 'activos') {
        return !m.tratamientoTerminado;
      } else if (this.filtroEstado === 'finalizados') {
        return !!m.tratamientoTerminado;
      }
      return true;
    });
  }

  cambiarFiltro(estado: 'todos' | 'activos' | 'finalizados') {
    this.filtroEstado = estado;
    this.filtrarMedicamentos();
  }

  async terminarTratamiento(med: Medicamento) {
    const alert = await this.alertController.create({
      header: 'Terminar tratamiento',
      subHeader: med.nombre,
      message: `¿Deseas marcar como finalizado el tratamiento de <strong>${med.nombre}</strong>?<br><br>Ya no saldrá en las tomas diarias de 'Hoy', pero permanecerá registrado en tu historial.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Finalizar',
          handler: () => {
            this.medicamentosService.terminarTratamiento(med.id);
            this.cargarMedicamentos();
            this.mostrarToast(`Tratamiento de ${med.nombre} finalizado y guardado en tu historial`);
          },
        },
      ],
    });
    await alert.present();
  }

  async reactivarTratamiento(med: Medicamento) {
    this.medicamentosService.reactivarTratamiento(med.id);
    this.cargarMedicamentos();
    this.mostrarToast(`Tratamiento de ${med.nombre} reactivado. Volverá a salir en tus tomas de Hoy.`);
  }

  abrirRegistro() {
    this.router.navigate(['/registrarM']);
  }

  async confirmarEliminar(med: Medicamento) {
    const alert = await this.alertController.create({
      header: 'Eliminar medicamento',
      message: `¿Estás seguro de que deseas eliminar <strong>${med.nombre}</strong> de tu botiquín?`,
      cssClass: 'alerta-eliminar',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.medicamentosService.eliminarMedicamento(med.id);
            this.cargarMedicamentos();
            this.mostrarToast(`${med.nombre} eliminado`);
          },
        },
      ],
    });

    await alert.present();
  }

  async editarMedicamento(med: Medicamento) {
    const alert = await this.alertController.create({
      header: 'Editar medicamento',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Nombre',
          value: med.nombre,
        },
        {
          name: 'dosis',
          type: 'text',
          placeholder: 'Dosis (ej. 500 mg · 1 tableta)',
          value: med.dosis,
        },
        {
          name: 'frecuencia',
          type: 'text',
          placeholder: 'Frecuencia (ej. Cada 8 horas)',
          value: med.frecuencia,
        },
        {
          name: 'duracion',
          type: 'text',
          placeholder: 'Duración (ej. 5 días)',
          value: med.duracion,
        },
        {
          name: 'stockRestante',
          type: 'number',
          placeholder: 'Stock restante',
          value: med.stockRestante.toString(),
        },
        {
          name: 'imagenUrl',
          type: 'text',
          placeholder: 'URL o ruta de imagen (opcional)',
          value: med.imagenUrl || '',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Guardar',
          handler: (data) => {
            if (!data.nombre || !data.nombre.trim()) {
              this.mostrarToast('El nombre no puede estar vacío');
              return false;
            }
            this.medicamentosService.actualizarMedicamento(med.id, {
              nombre: data.nombre.trim(),
              dosis: data.dosis?.trim() || med.dosis,
              frecuencia: data.frecuencia?.trim() || med.frecuencia,
              duracion: data.duracion?.trim() || med.duracion,
              stockRestante: parseInt(data.stockRestante, 10) || 0,
              imagenUrl: data.imagenUrl?.trim() || '',
            });
            this.cargarMedicamentos();
            this.mostrarToast('Medicamento actualizado');
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  getColorStock(stock: number): 'success' | 'warning' | 'danger' {
    if (stock <= 3) return 'danger';
    if (stock <= 7) return 'warning';
    return 'success';
  }

  formatearFecha(fechaStr?: string): string {
    if (!fechaStr) return 'No especificada';
    try {
      const partes = fechaStr.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      return fechaStr;
    } catch {
      return fechaStr;
    }
  }

  async mostrarToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
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
      this.mostrarToast('Asistente IA próximamente');
    }
  }
}

