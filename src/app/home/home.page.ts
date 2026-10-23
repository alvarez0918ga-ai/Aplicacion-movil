import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface TabNav {
  id: string;
  etiqueta: string;
  icono: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage {
  nombreUsuario = 'Usuario';
  fechaActual = 'Lunes, 12 de Octubre';

  // Al no haber medicamentos, dejamos esto preparado para cuando conectes tu lógica
  proximo: any = null;

  tabs: TabNav[] = [
    { id: 'inicio', etiqueta: 'Inicio', icono: 'home' },
    { id: 'historial', etiqueta: 'Historial', icono: 'document-text' },
    { id: 'camara', etiqueta: 'Cámara', icono: 'camera' },
    { id: 'perfil', etiqueta: 'Perfil', icono: 'person' },
  ];
  
  tabActivo = 'inicio';

  constructor(private router: Router) {}

  irA(id: string) {
    this.tabActivo = id;
    console.log('Ir a tab:', id);
  }
}