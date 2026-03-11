import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee';

/**
 * Komponenta za kreiranje novog zaposlenog.
 * Upravlja validacijom forme i slanjem podataka na backend.
 */
@Component({
  selector: 'app-employee-create',
  templateUrl: './employee-create.component.html',
  styleUrls: ['./employee-create.component.css']
})
export class EmployeeCreateComponent implements OnInit, OnDestroy {
  /** Grupa kontrola za formu zaposlenog */
  employeeForm!: FormGroup;
  
  /** Subject koji služi za uništavanje svih pretplata pri uništenju komponente */
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  /**
   * Inicijalizacija komponente i forme.
   * @returns void
   */
  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Čišćenje resursa i prekid RxJS pretplata.
   * @returns void
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicijalizuje reaktivnu formu sa validatorima.
   * Polja su usklađena sa HTML-om.
   * @returns void
   */
  private initForm(): void {
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

  /**
   * Obrađuje slanje forme. 
   * Mapira podatke i poziva servis.
   * @returns void
   */
  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const formValues = this.employeeForm.value;

    // Mapiranje polja prema modelu koji backend očekuje (Pravilo 3.1)
      const payload: any = {
      ime: formValues.firstName,
      prezime: formValues.lastName,
      email: formValues.email,
      brojTelefona: formValues.phoneNumber,
      datumRodjenja: formValues.birthDate,
      pol: formValues.gender,
      pozicija: formValues.position,
      departman: formValues.department,
      role: formValues.role,
      aktivan: true,
      username: formValues.email.split('@')[0], // Generišemo privremeni username
      password: "Sifra123!" // Default šifra
    };

    this.employeeService.createEmployee(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate(['/employees']);
        }
        // Error handling se vrši u globalnom interceptoru (Pravilo 5.1)
      });
  }

  /**
   * Pomoćna metoda za mapiranje checkbox vrednosti u niz stringova.
   * @param values Vrednosti iz forme
   * @returns string[] Niz permisija
   */
  private mapPermissions(values: any): string[] {
    const permissions: string[] = [];
    if (values.permCreate) permissions.push('CREATE');
    if (values.permEdit) permissions.push('EDIT');
    if (values.permDelete) permissions.push('DELETE');
    if (values.permView) permissions.push('VIEW');
    return permissions;
  }
}