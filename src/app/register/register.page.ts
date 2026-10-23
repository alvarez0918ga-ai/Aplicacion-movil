import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  verPassword = false;

  registerForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        // al menos una minúscula, una mayúscula y un número
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
      ],
    ],
  });

  constructor(private fb: FormBuilder, private router: Router) {}

  alternarPassword() {
    this.verPassword = !this.verPassword;
  }

  crearCuenta() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    // TODO: conectar con el servicio de registro
    console.log('Registro:', this.registerForm.value);
    this.router.navigate(['/home']);
  }

  registrarConGoogle() {
    console.log('Registro con Google');
  }

  irAInicioSesion() {
    this.router.navigate(['/login']);
  }
}