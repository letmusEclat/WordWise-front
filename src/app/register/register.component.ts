import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthCredentials } from '../components/auth-form/auth-form.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../login/login.component.scss']
})
export class RegisterComponent {
  creating = false;

  constructor(private router: Router, private auth: AuthService) {}

  handleRegister(credentials: AuthCredentials) {
    this.creating = true;
    // Simulated async registration
    setTimeout(() => {
      this.creating = false;
      this.auth.setUser(credentials.email);
      this.router.navigate(['/app']);
    }, 800);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
