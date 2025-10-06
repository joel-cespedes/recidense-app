import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../openapi/generated/services/auth.service';
import { AuthStateService } from '../services/auth-state.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner
  ]
})
export class Login {
  private authService = inject(AuthService);
  private authStateService = inject(AuthStateService);
  private router = inject(Router);

  // Signals
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  // loginForm = new FormGroup({
  //   alias: new FormControl('admin', [Validators.required, Validators.minLength(3)]),
  //   password: new FormControl('admin123', [Validators.required, Validators.minLength(6)])
  // });
  loginForm = new FormGroup({
    alias: new FormControl('profesional1', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('test123', [Validators.required, Validators.minLength(6)])
  });

  // gestor1 / password: test123 / Nombre: Carlos Gestor
  // gestor2 / password: test123 / Nombre: María Gestora
  // gestor3 / password: test123 / Nombre: José Gestor

  // profesional1 / password: test123 / Nombre: Luis Profesional
  // profesional2 / password: test123 / Nombre: Carmen Profesional
  // profesional3 / password: test123 / Nombre: Pedro Profesional

  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Por favor, completa todos los campos correctamente');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { alias, password } = this.loginForm.value;

    this.authService
      .loginAuthLoginPost({
        body: {
          alias: alias!,
          password: password!
        }
      })
      .subscribe({
        next: response => {
          // Guardar token y decodificar usuario
          this.authStateService.setToken(response.access_token);

          this.isLoading.set(false);

          // Navegar a select-residences después del login
          this.router.navigate(['/wrap/home/select-residences']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);

          if (error.status === 401) {
            this.errorMessage.set('Usuario o contraseña incorrectos');
          } else if (error.status === 0) {
            this.errorMessage.set('No se pudo conectar con el servidor');
          } else {
            this.errorMessage.set('Error al iniciar sesión. Intenta nuevamente');
          }
        }
      });
  }
}
