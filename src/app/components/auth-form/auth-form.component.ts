import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PasswordValidators } from '../../validators/password-validators';

export interface AuthCredentials {
  email: string;
  password: string;
}

@Component({
  selector: 'app-auth-form',
  templateUrl: './auth-form.component.html',
  styleUrls: ['./auth-form.component.scss']
})
export class AuthFormComponent {
  @Input() mode: 'login' | 'register' = 'login';
  @Input() submitting = false;
  @Output() submitCredentials = new EventEmitter<AuthCredentials>();

  public isSubmitted = false;

  public form: FormGroup = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+*-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9!@#$%^&*()_+\\-=[\\]{}|:;"\'<>,.?\\/]+$'),
        PasswordValidators.upperCaseCheck(),
        PasswordValidators.lengthCheck(6),
        PasswordValidators.numberCheck()
      ]
    ],
    confirmPassword: ['']
  });

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    if (this.mode === 'register') {
      this.form.get('confirmPassword')?.addValidators([
        Validators.required,
        this.matchPasswordValidator()
      ]);
    } else {
      // remove confirmPassword if not register
      this.form.removeControl('confirmPassword');
    }
  }

  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }

  private matchPasswordValidator() {
    return () => {
      const pwd = this.password?.value || '';
      const confirm = this.confirmPassword?.value || '';
      return pwd === confirm ? null : { mismatch: true };
    };
  }

  public submit(): void {
    this.isSubmitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitCredentials.emit({
      email: this.email?.value,
      password: this.password?.value
    });
  }
}
