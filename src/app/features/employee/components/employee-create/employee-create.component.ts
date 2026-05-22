import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { EmployeeService } from '../../services/employee.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { emailFormatValidator, phoneValidator, dateOfBirthValidator } from '../../../../shared/validators/custom-validators';

@Component({
  selector: 'app-employee-create',
  templateUrl: './employee-create.component.html',
  styleUrls: ['./employee-create.component.css']
})
export class EmployeeCreateComponent implements OnInit, OnDestroy {
  employeeForm!: FormGroup;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.employeeForm = this.fb.group({
      ime: ['', [Validators.required, Validators.minLength(2)]],
      prezime: ['', [Validators.required, Validators.minLength(2)]],
      datumRodjenja: ['1990-01-01', [Validators.required, dateOfBirthValidator()]],
      pol: ['M', Validators.required],
      email: ['', [Validators.required, Validators.email, emailFormatValidator()]],
      brojTelefona: ['', [Validators.required, phoneValidator()]],
      adresa: [''],
      pozicija: ['', Validators.required],
      departman: ['', Validators.required],
      role: ['BASIC', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.toastService.warning('Please fill in all required fields.');
      return;
    }

    this.isLoading = true;

    const formValues = this.employeeForm.value;

    const payload: any = {
      ...formValues,
      username: formValues.email.split('@')[0]
    };

    this.employeeService.createEmployee(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.toastService.success('Employee created successfully. Activation email sent.');
          this.router.navigate(['/employees']);
        },
        error: (err) => {
          this.isLoading = false;
          this.toastService.error(err.error?.message || 'Failed to create employee.');
        }
      });
  }
}
