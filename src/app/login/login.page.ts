import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  verPassword = false;

  loginForm = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(private fb: FormBuilder, private router: Router) {}

  alternarPassword() {
    this.verPassword = !this.verPassword;
  }

  iniciarSesion() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    console.log('Login:', this.loginForm.value);
    this.router.navigate(['/home']);
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }

  olvidePassword() {
    console.log('Recuperar contraseña');
  }

  iniciarConGoogle() {
    console.log('Login con Google');
  }
}