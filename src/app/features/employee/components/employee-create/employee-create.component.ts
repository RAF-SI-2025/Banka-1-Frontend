import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-create',
  templateUrl: './employee-create.component.html',
  styleUrls: ['./employee-create.component.css']
})
export class EmployeeCreateComponent implements OnInit, OnDestroy {
  employeeForm!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    // Ova imena (npr. fullName) MORAJU da se poklapaju sa formControlName u HTML-u
    this.employeeForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['Regular employee', Validators.required],
      status: ['Active', Validators.required],
      permCreate: [false],
      permEdit: [false],
      permDelete: [false],
      permView: [false]
    });
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const formValues = this.employeeForm.value;

    // Pošto u formi imaš "fullName", moramo ga razdvojiti na ime i prezime za backend
    const nameParts = formValues.fullName.trim().split(' ');
    const ime = nameParts[0] || '';
    const prezime = nameParts.slice(1).join(' ') || 'Prezime'; // Backend obično ne dozvoljava prazno prezime

    // Mapiranje polja prema tvom Employee modelu (srpski ključevi)
    const payload: any = {
      ime: ime,
      prezime: prezime,
      email: formValues.email,
      brojTelefona: "+38100000000", // Dodajemo default jer ga nema u ovoj formi a backend traži
      datumRodjenja: "1990-01-01", // Dodajemo default
      pol: "M",                    // Dodajemo default
      pozicija: formValues.role,
      departman: "Default",
      role: formValues.role === 'Admin' ? 'ADMIN' : 'BASIC',
      aktivan: formValues.status === 'Active',
      permisije: this.mapPermissions(formValues),
      username: formValues.email.split('@')[0],
      password: "Sifra123!"
    };

    this.employeeService.createEmployee(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate(['/employees']);
        },
        error: (err) => {
          console.error('Greška pri kreiranju:', err);
        }
      });
  }

  private mapPermissions(values: any): string[] {
    const permissions: string[] = [];
    if (values.permCreate) permissions.push('CREATE');
    if (values.permEdit) permissions.push('EDIT');
    if (values.permDelete) permissions.push('DELETE');
    if (values.permView) permissions.push('VIEW');
    return permissions;
  }
}
