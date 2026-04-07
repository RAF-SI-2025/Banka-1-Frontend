import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, EMPTY } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { ToastService } from 'src/app/shared/services/toast.service';
import { LoanService } from '../../../client/services/loan.service';

import {
  LoanRequestStatusLabels,
  LoanTypeLabels,
  LoanRequest,
  LoanType,
  InterestRateTypeLabels,
} from '../../../client/models/loan.model';

@Component({
  selector: 'app-loan-request-management',
  templateUrl: './loan-request-management.component.html',
  styleUrls: ['./loan-request-management.component.css']
})
export class LoanRequestManagementComponent implements OnInit, OnDestroy {
  loanRequests: LoanRequest[] = [];
  isLoading = false;

  filterLoanType: LoanType | '' = '';
  filterAccountNumber = '';

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  selectedLoanRequest: LoanRequest | null = null;
  confirmAction: { type: 'approve' | 'reject'; request: LoanRequest } | null = null;
  isActioning = false;

  readonly LoanType = LoanType;
  readonly loanTypeLabels = LoanTypeLabels;
  readonly requestStatusLabels = LoanRequestStatusLabels;
  readonly interestRateTypeLabels = InterestRateTypeLabels;

  readonly loanTypeOptions: { value: LoanType | ''; label: string }[] = [
    { value: '', label: 'Sve vrste kredita' },
    { value: LoanType.CASH, label: 'Gotovinski' },
    { value: LoanType.MORTGAGE, label: 'Stambeni' },
    { value: LoanType.AUTO, label: 'Auto' },
    { value: LoanType.REFINANCING, label: 'Refinansirajući' },
    { value: LoanType.STUDENT, label: 'Studentski' },
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
        return this.loanService.getLoanRequests(
          {
            loanType: this.filterLoanType,
            accountNumber: this.filterAccountNumber,
          },
          this.currentPage,
          this.pageSize
        ).pipe(
          catchError((err) => {
            this.isLoading = false;
            this.toastService.error(err?.error?.message || 'Greška pri učitavanju zahteva za kredite.');
            return EMPTY;
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((data) => {
      this.loanRequests = data.content ?? [];
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

  loadLoanRequests(): void {
    this.reload$.next();
  }

  onFilterChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage = 0;
      this.loadLoanRequests();
    }, 300);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadLoanRequests();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadLoanRequests();
  }

  getLastItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  openDetail(request: LoanRequest): void {
    this.selectedLoanRequest = request;
  }

  closeDetail(): void {
    this.selectedLoanRequest = null;
  }

  promptApprove(request: LoanRequest, event?: Event): void {
    event?.stopPropagation();
    this.confirmAction = { type: 'approve', request };
  }

  promptReject(request: LoanRequest, event?: Event): void {
    event?.stopPropagation();
    this.confirmAction = { type: 'reject', request };
  }

  cancelConfirm(): void {
    this.confirmAction = null;
  }

  executeAction(): void {
    if (!this.confirmAction) {
      return;
    }

    const { type, request } = this.confirmAction;
    const action$ =
      type === 'approve'
        ? this.loanService.approveLoanRequest(request.id)
        : this.loanService.rejectLoanRequest(request.id);

    this.isActioning = true;

    action$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toastService.success(
          type === 'approve'
            ? 'Zahtev za kredit je uspešno odobren.'
            : 'Zahtev za kredit je uspešno odbijen.'
        );

        this.isActioning = false;
        this.confirmAction = null;

        if (this.selectedLoanRequest?.id === request.id) {
          this.selectedLoanRequest = {
            ...this.selectedLoanRequest,
            status: type === 'approve' ? 'APPROVED' : 'REJECTED'
          };
        }

        this.loadLoanRequests();
      },
      error: (err) => {
        this.isActioning = false;
        this.confirmAction = null;
        this.toastService.error(
          err?.error?.message || 'Greška pri obradi zahteva.'
        );
      }
    });
  }

  getRequestStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'z-badge-green';
      case 'REJECTED':
        return 'z-badge-red';
      case 'PENDING':
        return 'z-badge-yellow';
      default:
        return 'z-badge-gray';
    }
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

  trackById(_: number, item: LoanRequest): number {
    return item.id;
  }
}
