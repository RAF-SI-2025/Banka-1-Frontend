import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator za email format
 * Proverava da li je email u validnom formatu (npr. banka@primer.rs)
 */
export function emailFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    // Regex koji proverava valid email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(control.value)) {
      return { invalidEmailFormat: true };
    }

    return null;
  };
}

/**
 * Validator za broj telefona
 * Proverava da li broj telefona sadrži samo cifre i opciono + na početku
 */
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    // Regex koji proverava: opciono + na početku, zatim samo cifre, razmaci, zarezi, zagrade i crta
    const phoneRegex = /^(\+)?[0-9\s\-\(\)]{6,20}$/;

    if (!phoneRegex.test(control.value)) {
      return { invalidPhoneFormat: true };
    }

    // Proverava da li sadrži bar nekoliko cifara
    const digitsOnly = control.value.replace(/\D/g, '');
    if (digitsOnly.length < 6) {
      return { invalidPhoneFormat: true };
    }

    return null;
  };
}

/**
 * Validator za datum rođenja
 * Proverava da li datum nije u budućnosti i da li je validan
 */
export function dateOfBirthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const selectedDate = new Date(control.value);
    const today = new Date();

    // Pokreni time za jednostavniju poređenje
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Proverava da li je datum u budućnosti
    if (selectedDate > today) {
      return { futureDate: true };
    }

    // Opciono: proverava da li je osoba starija od 18 godina
    const age = today.getFullYear() - selectedDate.getFullYear();
    const monthDiff = today.getMonth() - selectedDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
      const adjustedAge = age - 1;
      if (adjustedAge < 0) {
        return { futureDate: true };
      }
    }

    return null;
  };
}

/**
 * Validator za JMBG (13 cifara)
 */
export function jmbgValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const jmbgRegex = /^\d{13}$/;

    if (!jmbgRegex.test(control.value)) {
      return { invalidJMBG: true };
    }

    return null;
  };
}

/**
 * Custom validator koji kombinuje email validaciju
 */
export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    // Koristi standard email validator plus custom format validator
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(control.value)) {
      return { invalidEmail: true };
    }

    return null;
  };
}
