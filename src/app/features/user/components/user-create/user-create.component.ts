import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UserService } from '../../user.service';

export type User = {
  ime: string;
  prezime: string;
  datumRodjenja: number;
  pol: string;
  email: string;
  brojTelefona: string;
  adresa: string;
  jmbg: string;
}

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss'],
})
export class UserCreateComponent {
  public firstName = '';
  public lastName = '';
  public dateOfBirth = '';
  public gender = '';
  public email = '';
  public phone = '';
  public address = '';
  public jmbg = '';
  public submitting = false;

  // Validation error messages
  public validationErrors: { [key: string]: string } = {};

  constructor(private router: Router, private route: ActivatedRoute, private userService: UserService) {}

  /**
   * Validira sve polja forme
   */
  private validateForm(): boolean {
    this.validationErrors = {};
    let isValid = true;

    // Validira email
    if (!this.email) {
      this.validationErrors['email'] = 'Email je obavezan.';
      isValid = false;
    } else if (!this.isValidEmail(this.email)) {
      this.validationErrors['email'] = 'Email mora biti validnog formata (npr. banka@primer.rs).';
      isValid = false;
    }

    // Validira telefon
    if (this.phone && !this.isValidPhone(this.phone)) {
      this.validationErrors['phone'] = 'Broj telefona može sadržavati samo cifre i opciono + na početku.';
      isValid = false;
    }

    // Validira datum rođenja
    if (!this.dateOfBirth) {
      this.validationErrors['dateOfBirth'] = 'Datum rođenja je obavezan.';
      isValid = false;
    } else if (!this.isValidDateOfBirth(this.dateOfBirth)) {
      this.validationErrors['dateOfBirth'] = 'Datum rođenja ne sme biti u budućnosti.';
      isValid = false;
    }

    return isValid;
  }

  /**
   * Proverava da li je email validan
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Proverava da li je telefon validan (samo cifre i opciono + na početku)
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+)?[0-9\s\-\(\)]{6,20}$/;
    if (!phoneRegex.test(phone)) {
      return false;
    }
    // Proverava da li ima bar nekoliko cifara
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 6;
  }

  /**
   * Proverava da li datum nije u budućnosti
   */
  private isValidDateOfBirth(date: string): boolean {
    const selectedDate = new Date(date);
    const today = new Date();
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return selectedDate <= today;
  }

  /**
   * Proverava da li je forma validna
   */
  public isFormValid(): boolean {
    return !!this.firstName &&
           !!this.lastName &&
           !!this.dateOfBirth &&
           !!this.gender &&
           !!this.email &&
           !!this.jmbg &&
           this.jmbg.length === 13 &&
           this.isValidEmail(this.email) &&
           (!this.phone || this.isValidPhone(this.phone)) &&
           this.isValidDateOfBirth(this.dateOfBirth);
  }

  public submit(form: NgForm): void {
    this.submitting = true;

    // Validira sve polje
    if (!this.validateForm()) {
      form.form.markAllAsTouched();
      this.submitting = false;
      return;
    }

    // If form is invalid, do not proceed and show validation messages
    if (form.invalid) {
      form.form.markAllAsTouched();
      this.submitting = false;
      return;
    }
    const user: User = {
      ime: this.firstName,
      prezime: this.lastName,
      datumRodjenja: new Date(this.dateOfBirth).getTime(),
      pol: this.gender,
      email: this.email,
      brojTelefona: this.phone,
      adresa: this.address,
      jmbg: this.jmbg
    };

    this.userService.createUser(user).subscribe({
      next: (createdUser) => {
        // Simulate creation and generate an id. In real app, call UserService.create(...) and use returned id.
        const createdId = 'c' + String(Math.floor(Math.random() * 1000000));
        const createdName = `${this.firstName} ${this.lastName}`.trim();
        
          // Read returnUrl from query params (if provided)
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/clients';
          
          // Navigate back to returnUrl with navigation state containing createdClientId and name
        this.router.navigateByUrl(returnUrl, { state: { createdClientId: createdId, createdClientName: createdName } });
        return;
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.submitting = false;
      }
    });

  }
}
