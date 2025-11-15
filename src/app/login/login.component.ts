import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { PasswordValidators } from '../validators/password-validators';
import { AuthCredentials } from '../components/auth-form/auth-form.component';
import { AuthService } from '../services/auth.service';

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
    this.isSubmitting = true;
    setTimeout(() => {
      this.auth.setUser(credentials.email);
      this.router.navigate(['/app']);
    }, 450);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
