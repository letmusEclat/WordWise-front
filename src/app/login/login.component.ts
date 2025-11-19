import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { PasswordValidators } from '../validators/password-validators';
import { AuthCredentials } from '../components/auth-form/auth-form.component';
import { AuthService } from '../services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public isSubmitting = false;

  // Legacy form retained temporarily if needed elsewhere; not used in template now.
  public form: FormGroup = this.fb.group({});

  constructor(private router: Router, private fb: FormBuilder, private auth: AuthService) {}

  handleLogin(credentials: AuthCredentials) {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.auth.login(credentials.email, credentials.password)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => this.router.navigate(['/app']),
        error: () => {
          // Simple fallback: show error state (could integrate toast)
          alert('Credenciales inválidas');
        }
      });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
