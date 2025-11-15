import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class PasswordValidators {
  static upperCaseCheck(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: string = control.value || '';
      if (!value) return null; // handled by required
      return /[A-Z]/.test(value) ? null : { uppercase: true };
    };
  }

  static lengthCheck(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: string = control.value || '';
      if (!value) return null; // required handles empty case
      return value.length >= min ? null : { minLength: { requiredLength: min, actualLength: value.length } };
    };
  }

  static numberCheck(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: string = control.value || '';
      if (!value) return null;
      return /\d/.test(value) ? null : { number: true };
    };
  }
}
