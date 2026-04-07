import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, Subject, EMPTY } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { ToastService } from 'src/app/shared/services/toast.service';
import { LoanService } from '../../../client/services/loan.service';
import {
  Installment,
  Loan,
  LoanStatus,
  LoanTypeLabels,
  LoanType,
  InterestRateTypeLabels,
} from '../../../client/models/loan.model';

@Component({
  selector: 'app-loan-management',
  templateUrl: './loan-management.component.html',
  styleUrls: ['./loan-management.component.css']
})
export class LoanManagementComponent implements OnInit, OnDestroy {
  loans: Loan[] = [];
  isLoading = false;

  filterLoanType: LoanType | '' = '';
  filterAccountNumber = '';
  filterStatus: LoanStatus | '' = '';

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  selectedLoan: Loan | null = null;
  selectedInstallments: Installment[] = [];
  isDetailLoading = false;
  detailError: string | null = null;

  readonly LoanType = LoanType;
  readonly loanTypeLabels = LoanTypeLabels;
  readonly interestRateTypeLabels = InterestRateTypeLabels;

  readonly loanTypeOptions: { value: LoanType | ''; label: string }[] = [
    { value: '', label: 'Sve vrste kredita' },
    { value: LoanType.CASH, label: 'Gotovinski' },
    { value: LoanType.MORTGAGE, label: 'Stambeni' },
    { value: LoanType.AUTO, label: 'Auto' },
    { value: LoanType.REFINANCING, label: 'Refinansirajući' },
    { value: LoanType.STUDENT, label: 'Studentski' },
  ];

  readonly statusOptions: { value: LoanStatus | ''; label: string }[] = [
    { value: '', label: 'Svi statusi' },
    { value: 'APPROVED', label: 'Odobren' },
    { value: 'ACTIVE', label: 'Odobren' },
    { value: 'DELAYED', label: 'U kašnjenju' },
    { value: 'PAID_OFF', label: 'Otplaćen' },
    { value: 'REJECTED', label: 'Odbijen' },
  ];

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly reload$ = new Subject<void>();

  constructor(
    private readonly loanService: LoanService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.reload$.pipe(
      switchMap(() => {
        this.isLoading = true;
        return this.loanService.getAllLoans(
          {
            loanType: this.filterLoanType,
            accountNumber: this.filterAccountNumber,
            status: this.filterStatus,
          },
          this.currentPage,
          this.pageSize
        ).pipe(
          catchError((err) => {
            this.isLoading = false;
            this.toastService.error(err?.error?.message || 'Greška pri učitavanju kredita.');
            return EMPTY;
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((data) => {
      this.loans = data.content ?? [];
      this.totalElements = data.totalElements ?? 0;
      this.totalPages = data.totalPages ?? 0;
      this.isLoading = false;
    });

    this.reload$.next();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLoans(): void {
    this.reload$.next();
  }

  onFilterChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage = 0;
      this.loadLoans();
    }, 300);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadLoans();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadLoans();
  }

  getLastItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  openDetail(loan: Loan): void {
    this.selectedLoan = loan;
    this.selectedInstallments = [];
    this.detailError = null;
    this.isDetailLoading = true;

    forkJoin({
      loan: this.loanService.getEmployeeLoanById(loan.id),
      installments: this.loanService.getEmployeeLoanInstallments(loan.id)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ loan: detail, installments }) => {
        this.selectedLoan = detail;
        this.selectedInstallments = installments ?? [];
        this.isDetailLoading = false;
      },
      error: (err) => {
        this.detailError = err?.error?.message || 'Greška pri učitavanju detalja kredita.';
        this.isDetailLoading = false;
      }
    });
  }

  closeDetail(): void {
    this.selectedLoan = null;
    this.selectedInstallments = [];
    this.detailError = null;
    this.isDetailLoading = false;
  }

  getLoanStatusLabel(status: string | null | undefined): string {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return 'Odobren';
      case 'DELAYED':
      case 'OVERDUE':
        return 'U kašnjenju';
      case 'PAID_OFF':
      case 'REPAID':
        return 'Otplaćen';
      case 'REJECTED':
        return 'Odbijen';
      default:
        return status || 'Nepoznato';
    }
  }

  getLoanStatusClass(status: string | null | undefined): string {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return 'z-badge-green';
      case 'DELAYED':
      case 'OVERDUE':
        return 'z-badge-red';
      case 'PAID_OFF':
      case 'REPAID':
        return 'z-badge-blue';
      case 'REJECTED':
        return 'z-badge-gray';
      default:
        return 'z-badge-gray';
    }
  }

  getInstallmentStatusLabel(status: string | null | undefined): string {
    switch (status) {
      case 'PAID':
        return 'Plaćeno';
      case 'UNPAID':
        return 'Neplaćeno';
      case 'LATE':
        return 'Kasni';
      default:
        return status || 'Nepoznato';
    }
  }

  getInstallmentStatusClass(status: string | null | undefined): string {
    switch (status) {
      case 'PAID':
        return 'z-badge-green';
      case 'UNPAID':
        return 'z-badge-yellow';
      case 'LATE':
        return 'z-badge-red';
      default:
        return 'z-badge-gray';
    }
  }

  getLoanType(loan: Loan): string {
    return (loan.loanType || loan.creditType || loan.type || '') as string;
  }

  getLoanNumber(loan: Loan): string | number {
    return loan.loanNumber || loan.creditNumber || loan.number || loan.id;
  }

  getRepaymentPeriodMonths(loan: Loan): number | string {
    return loan.repaymentPeriodMonths ?? loan.repaymentPeriod ?? '-';
  }

  getInstallmentAmount(loan: Loan): number | undefined {
    return loan.installmentAmount ?? loan.nextInstallmentAmount;
  }

  formatCurrency(value: number | null | undefined, currency = 'RSD'): string {
    const amount = value ?? 0;

    return `${new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)} ${currency}`;
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) {
      return '-';
    }

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) {
      return dateStr;
    }

    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '-';
    }

    return `${value}%`;
  }

  trackById(_: number, item: Loan): string | number {
    return item.id;
  }

  trackInstallment(_: number, item: Installment): number | string | undefined {
    return item.id;
  }
}
