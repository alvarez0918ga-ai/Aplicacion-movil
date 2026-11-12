import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-camara',
  templateUrl: './camara.page.html',
  styleUrls: ['./camara.page.scss'],
  standalone: false,
})
export class CamaraPage {
  // Datos del formulario de medicamento
  medicamento = {
    nombre: '',
    dosis: '',
    hora: '08:00',
    notas: '',
  };

  imagenUrl: string | undefined;

  constructor(private router: Router) { }

  async escanearMedicamento() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      this.imagenUrl = `data:image/${image.format || 'jpeg'};base64,${image.base64String}`;
    } catch (error) {
      console.log('Operación cancelada o error al capturar imagen:', error);
    }
  }

  async subirDesdeGaleria() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      this.imagenUrl = `data:image/${image.format || 'jpeg'};base64,${image.base64String}`;
    } catch (error) {
      console.log('Operación cancelada o error al abrir galería:', error);
    }
  }


  eliminarFoto() {
    this.imagenUrl = undefined;
  }

  
  guardarMedicamento() {
    if (!this.medicamento.nombre.trim()) {
      alert('Por favor ingresa el nombre del medicamento');
      return;
    }

    console.log('Medicamento registrado:', {
      ...this.medicamento,
      foto: this.imagenUrl,
    });

    // Regresa a la pantalla principal
    this.router.navigate(['/home']);
  }
}
