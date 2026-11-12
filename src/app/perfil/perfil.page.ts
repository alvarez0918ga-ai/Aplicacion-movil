import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { SonidosService } from '../services/sonidos.service';

export interface TabNav {
  id: string;
  etiqueta: string;
  icono?: string;
  tipo?: 'icono' | 'capsula' | 'robot';
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false,
})
export class PerfilPage implements OnInit {
  usuario = {
    nombre: 'Luis Giovanni Alvarez Alvarez',
    correo: 'luis.alvarez@gmail.com',
    telefono: '+52 72 1483 9270',
    edad: '19 años',
    fechaNacimiento: '18 de septiembre de 2007',
  };

  contactoEmergencia = {
    nombre: 'Elisa Alvarez Fabila',
    parentesco: 'Madre',
    telefono: '+52 72 2391 0046',
  };

  tabs: TabNav[] = [
    { id: 'hoy', etiqueta: 'Hoy', icono: 'time-outline', tipo: 'icono' },
    { id: 'medicamentos', etiqueta: 'Medicamentos', icono: 'medkit-outline', tipo: 'icono' },
    { id: 'soporte', etiqueta: 'IA / Soporte', tipo: 'robot' },
    { id: 'perfil', etiqueta: 'Perfil', icono: 'person-outline', tipo: 'icono' },
  ];

  tabActivo = 'perfil';

  // Configuración de Sonido de Notificación
  tonoSeleccionado: string = 'campana';
  tonosDisponibles: any[] = [];
  audioPersonalizadoNombre: string = '';

  constructor(
    private router: Router,
    private sonidosService: SonidosService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.tonosDisponibles = this.sonidosService.tonosDisponibles;
    this.cargarConfiguracionSonido();
  }

  ionViewWillEnter() {
    this.tabActivo = 'perfil';
    this.cargarConfiguracionSonido();
  }

  cargarConfiguracionSonido() {
    this.tonoSeleccionado = this.sonidosService.obtenerTonoActual();
    const custom = this.sonidosService.obtenerAudioPersonalizado();
    if (custom) {
      this.audioPersonalizadoNombre = custom.nombre;
    }
  }

  alCambiarTono(nuevoTono: any) {
    this.tonoSeleccionado = nuevoTono;
    this.sonidosService.guardarTono(nuevoTono);
    this.sonidosService.reproducirTono(nuevoTono);
    this.mostrarToast('Tono de notificación actualizado');
  }

  probarTonoActual() {
    this.sonidosService.reproducirTono(this.tonoSeleccionado);
  }

  // Importar sonido propio desde el dispositivo (.mp3, .wav, etc.)
  importarAudio(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('audio')) {
      alert('Por favor selecciona un archivo de audio válido (.mp3, .wav, .m4a).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.sonidosService.guardarAudioPersonalizado(file.name, base64);
      this.audioPersonalizadoNombre = file.name;
      this.tonoSeleccionado = 'personalizado';
      this.sonidosService.reproducirTono('personalizado');
      this.mostrarToast(`Audio "${file.name}" importado y activado`);
    };
    reader.readAsDataURL(file);
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
      console.log('Botón Asistente IA presionado');
    }
  }

  cerrarSesion() {
    this.router.navigate(['/login']);
  }
}
