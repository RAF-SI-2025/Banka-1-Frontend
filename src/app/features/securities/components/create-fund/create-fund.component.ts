import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { Employee } from '../../../employee/models/employee';
import { EmployeeService } from '../../../employee/services/employee.service';
import { InvestmentFund } from '../../models/investment-fund.model';
import { InvestmentFundService } from '../../services/investment-fund.service';

@Component({
  selector: 'app-create-fund',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  templateUrl: './create-fund.component.html',
  styleUrls: ['./create-fund.component.scss'],
})
export class CreateFundComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  fundForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    minimumContribution: [1000, [Validators.required, Validators.min(1)]],
    managerId: [null as number | null, Validators.required],
  });

  supervisors: Employee[] = [];
  existingFunds: InvestmentFund[] = [];
  isLoading = true;
  isSubmitting = false;
  loadWarning = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly employeeService: EmployeeService,
    private readonly fundService: InvestmentFundService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.fundForm.invalid) {
      this.fundForm.markAllAsTouched();
      this.toastService.warning('Popunite sva obavezna polja za kreiranje fonda.');
      return;
    }

    const raw = this.fundForm.getRawValue();
    const normalizedName = this.normalizeFundName(raw.name);

    if (this.isFundNameTaken(normalizedName)) {
      this.fundForm.get('name')?.setErrors({ notUnique: true });
      this.toastService.error('Fond sa ovim nazivom već postoji.');
      return;
    }

    this.isSubmitting = true;
    this.fundService
      .createFund({
        name: normalizedName,
        description: raw.description!.trim(),
        minimumContribution: Number(raw.minimumContribution),
        managerId: Number(raw.managerId),
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Investicioni fond je kreiran i odmah je dostupan u sistemu.');
          this.router.navigate(['/securities']);
        },
        error: (err) => {
          const message = err.error?.message || 'Greška pri kreiranju investicionog fonda.';
          if (this.looksLikeDuplicateName(message)) {
            this.fundForm.get('name')?.setErrors({ notUnique: true });
          }
          this.toastService.error(message);
        },
      });
  }

  formatSupervisor(employee: Employee): string {
    const name = [employee.ime, employee.prezime].filter(Boolean).join(' ');
    return `${name || employee.email} (${employee.email})`;
  }

  getSupervisorId(employee: Employee): number | null {
    const id = employee.id ?? (employee as any).employeeId;
    return id === undefined || id === null ? null : Number(id);
  }

  private loadInitialData(): void {
    this.isLoading = true;
    forkJoin({
      employees: this.employeeService.getEmployees(0, 500).pipe(
        catchError(() => {
          this.loadWarning = 'Nije uspelo učitavanje liste supervizora.';
          return of({ content: [] });
        }),
      ),
      funds: this.fundService.getFunds(0, 500).pipe(
        catchError(() => {
          this.loadWarning = 'Nije uspelo učitavanje postojećih fondova; jedinstvenost naziva će potvrditi backend.';
          return of({ content: [] });
        }),
      ),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe(({ employees, funds }) => {
        const items = Array.isArray(employees) ? employees : employees.content ?? [];
        this.supervisors = items.filter((employee: Employee) => this.isSupervisor(employee));
        this.ensureLoggedSupervisorOption();
        this.existingFunds = funds.content ?? [];
        this.selectDefaultManager();
      });
  }

  private ensureLoggedSupervisorOption(): void {
    const userId = this.authService.getUserIdFromToken();
    const user = this.authService.getLoggedUser();

    if (!userId || !user?.email) {
      return;
    }

    const alreadyPresent = this.supervisors.some((supervisor) => {
      return this.getSupervisorId(supervisor) === userId || supervisor.email === user.email;
    });

    if (alreadyPresent) {
      return;
    }

    this.supervisors = [
      {
        id: userId,
        ime: 'Ulogovani',
        prezime: 'supervizor',
        datumRodjenja: '',
        pol: '',
        email: user.email,
        brojTelefona: '',
        role: 'SUPERVISOR',
        permisije: ['FUND_AGENT_MANAGE'],
      },
      ...this.supervisors,
    ];
  }

  private selectDefaultManager(): void {
    const userId = this.authService.getUserIdFromToken();
    const user = this.authService.getLoggedUser();
    const currentSupervisor = this.supervisors.find((supervisor) => {
      return this.getSupervisorId(supervisor) === userId || supervisor.email === user?.email;
    });

    const selected = currentSupervisor ?? this.supervisors[0];
    const selectedId = selected ? this.getSupervisorId(selected) : null;
    if (selectedId) {
      this.fundForm.patchValue({ managerId: selectedId });
    }
  }

  private isSupervisor(employee: Employee): boolean {
    const role = (employee.role ?? '').toUpperCase();
    const permissions = (employee.permisije ?? []).map((permission) => permission.toUpperCase());
    return role === 'SUPERVISOR' || role === 'ADMIN' || permissions.includes('FUND_AGENT_MANAGE');
  }

  private isFundNameTaken(name: string): boolean {
    const normalized = this.normalizeFundName(name).toLowerCase();
    return this.existingFunds.some((fund) => this.normalizeFundName(fund.name).toLowerCase() === normalized);
  }

  private normalizeFundName(name: string | null | undefined): string {
    return (name ?? '').trim().replace(/\s+/g, ' ');
  }

  private looksLikeDuplicateName(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes('unique') || normalized.includes('exists') || normalized.includes('postoji');
  }
}
