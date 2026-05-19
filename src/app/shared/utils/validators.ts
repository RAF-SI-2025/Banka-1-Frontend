import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validira da polje sadrži tačno određeni broj cifara.
 * @param length - Traženi broj cifara
 * @returns Validator funkcija
 */
export function exactDigitsValidator(length: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = String(control.value).trim();
    const digitsOnly = /^\d+$/.test(value);

    if (!digitsOnly) {
      return { notDigitsOnly: true };
    }

    if (value.length !== length) {
      return { exactDigits: { requiredLength: length, actualLength: value.length } };
    }

    return null;
  };
}

/**
 * Validira format email adrese (Celina 1 — "Email mora biti validnog formata").
 * Jedinstvenost se proverava na backendu; ovaj validator pokriva samo format.
 * Prazna vrednost je validna — prisustvo prepustamo `Validators.required`.
 * @returns `{ emailFormat: true }` ako format nije ispravan, inace `null`.
 */
export function emailFormatValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value === null || control.value === undefined || control.value === '') {
    return null;
  }

  const value = String(control.value).trim();
  // Lokalni deo + @ + domen sa bar jednim tackom-odvojenim TLD-om; bez razmaka.
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(value) ? null : { emailFormat: true };
}

/**
 * Validira broj telefona (Celina 1 — "samo cifre i znak '+' na pocetku").
 * Regex `^\+?[0-9]{8,15}$` odgovara backend `@Pattern` ogranicenju.
 * Prazna vrednost je validna — prisustvo prepustamo `Validators.required`.
 * @returns `{ phoneFormat: true }` ako format nije ispravan, inace `null`.
 */
export function phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value === null || control.value === undefined || control.value === '') {
    return null;
  }

  const value = String(control.value).trim();
  const phonePattern = /^\+?[0-9]{8,15}$/;

  return phonePattern.test(value) ? null : { phoneFormat: true };
}

/**
 * Validira da datum nije u buducnosti (Celina 1 — "Datum rodjenja ne sme biti
 * u buducnosti"). Radi sa ISO date-string vrednoscu kontrole (npr. "1990-01-01").
 * Neispravan datum-string se tretira kao nevalidan.
 * Prazna vrednost je validna — prisustvo prepustamo `Validators.required`.
 * @returns `{ futureDate: true }` ako je datum u buducnosti ili neispravan, inace `null`.
 */
export function notFutureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value === null || control.value === undefined || control.value === '') {
    return null;
  }

  const parsed = new Date(String(control.value));
  if (Number.isNaN(parsed.getTime())) {
    return { futureDate: true };
  }

  // Poredimo na nivou dana — danasnji datum je dozvoljen.
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return parsed.getTime() > today.getTime() ? { futureDate: true } : null;
}
