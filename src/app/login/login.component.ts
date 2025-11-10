import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public credentials = {
    email: '',
    password: ''
  };

  public isSubmitting = false;

  constructor(private router: Router) {}

  public submitLogin(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    // Simulamos una llamada asíncrona antes de redirigir.
    setTimeout(() => {
      this.router.navigate(['/app']);
      this.isSubmitting = false;
    }, 450);
  }

  public handleRegister(): void {
    // Placeholder para futura navegación de registro.
    console.log('Ir a registro');
  }
}
