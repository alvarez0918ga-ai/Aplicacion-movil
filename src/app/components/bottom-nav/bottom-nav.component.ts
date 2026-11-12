import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

export interface TabNav {
  id: string;
  etiqueta: string;
  icono?: string;
  tipo?: 'icono' | 'capsula' | 'robot';
}

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  standalone: false,
})
export class BottomNavComponent {
  @Input() tabActivo: string = 'hoy';
  @Output() tabSeleccionado = new EventEmitter<string>();

  tabs: TabNav[] = [
    { id: 'hoy', etiqueta: 'Hoy', icono: 'time-outline', tipo: 'icono' },
    { id: 'medicamentos', etiqueta: 'Medicamentos', icono: 'medkit-outline', tipo: 'icono' },
    { id: 'soporte', etiqueta: 'IA / Soporte', tipo: 'robot' },
    { id: 'perfil', etiqueta: 'Perfil', icono: 'person-outline', tipo: 'icono' },
  ];

  constructor(private router: Router) { }

  irA(id: string) {
    this.tabActivo = id;
    this.tabSeleccionado.emit(id);

    switch (id) {
      case 'hoy':
        this.router.navigate(['/home']);
        break;
      case 'medicamentos':
        this.router.navigate(['/medicamentos']);
        break;
      case 'perfil':
        this.router.navigate(['/perfil']);
        break;
      case 'soporte':
        console.log('Botón Asistente IA presionado');
        break;
    }
  }
}

