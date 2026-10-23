import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bienvenida',
  templateUrl: './bienvenida.page.html',
  styleUrls: ['./bienvenida.page.scss'],
  standalone: false,
})
export class BienvenidaPage {
  // Cambia aquí los textos de la pantalla
  nombreApp = 'DoxiDetect';
  lema = 'Tu tratamiento bajo control.';

  constructor(private router: Router) {}

  comenzar() {
    this.router.navigate(['/login']);
  }
}