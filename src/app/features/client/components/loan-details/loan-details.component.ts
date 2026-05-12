import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Loan, Installment, LoanTypeLabels, InstallmentStatus, InstallmentStatusLabels } from '../../models/loan.model';
import { LoanService } from '../../services/loan.service';
// PR_31 T11: shared StateComponent za loading/empty/error markup.
import { StateComponent } from '../../../../shared/components/state/state.component';
@Component({
  selector: 'app-loan-details',
  standalone: true,
  imports: [CommonModule, StateComponent],
  templateUrl: './loan-details.component.html',
  styleUrls: ['./loan-details.component.scss']
})
export class LoanDetailsComponent implements OnInit {
  loan: Loan | null = null;
  installments: Installment[] = [];

  isLoading = true;
  hasError = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private readonly loanService: LoanService
  ) {}

  ngOnInit(): void {
  const loanId = this.route.snapshot.paramMap.get('id');
  if (loanId) {
    // UKLONI znak '+' ispred loanId
    this.loadLoanDetails(loanId);
  } else {
    this.hasError = true;
    this.errorMessage = 'ID kredita nije prosleđen.';
    this.isLoading = false;
  }
}

  loadLoanDetails(loanId: string | number): void {
  this.isLoading = true;
  this.loanService.getLoanById(loanId).subscribe({
    next: (loan) => {
      this.loan = loan;
      this.loadInstallments(loanId);
    },
    error: (err) => {
      this.isLoading = false;
      this.hasError = true;
      this.errorMessage = 'Kredit nije pronađen.';
    }
  });
}

  private loadInstallments(loanId: string | number): void {
    this.loanService.getLoanInstallments(loanId).subscribe({
      next: (installments) => {
        this.installments = installments;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = err.error?.message || 'Greška pri učitavanju rata.';
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  getLoanTypeLabel(type: string | undefined): string {
    if (!type) return 'Nepoznato';
    return LoanTypeLabels[type as keyof typeof LoanTypeLabels] || type;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}.`;
    } catch {
      return dateString;
    }
  }

  formatCurrency(amount: number | undefined, currency: string | undefined = 'RSD'): string {
    if (amount === undefined || amount === null) return `0.00 ${currency}`;
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatPercent(value: number | undefined): string {
    if (value === undefined || value === null) return '0%';
    return `${value}%`;
  }
  getInstallmentStatusLabel(status: string | undefined): string {
    if (!status) return 'Nepoznato';
    return InstallmentStatusLabels[status as keyof typeof InstallmentStatusLabels] || status;
  }

  getStatusBadgeClass(status: string | undefined): string {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'UNPAID': return 'bg-orange-100 text-orange-700';
      case 'LATE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
