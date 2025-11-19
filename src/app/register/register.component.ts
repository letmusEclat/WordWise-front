import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthCredentials } from '../components/auth-form/auth-form.component';
import { AuthService } from '../services/auth.service';
import { finalize, switchMap } from 'rxjs';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../login/login.component.scss']
})
export class RegisterComponent {
  creating = false;

  constructor(private router: Router, private auth: AuthService) {}

  handleRegister(credentials: AuthCredentials) {
    if (this.creating) return;
    this.creating = true;
    this.auth.register(credentials.email, credentials.password)
      .pipe(
        switchMap(() => this.auth.login(credentials.email, credentials.password)),
        finalize(() => this.creating = false)
      )
      .subscribe({
        next: () => this.router.navigate(['/app']),
        error: () => alert('No se pudo registrar. Intenta nuevamente.')
      });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
