import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Loan, Installment, LoanTypeLabels, InstallmentStatus, InstallmentStatusLabels } from '../../models/loan.model';
import { LoanService } from '../../services/loan.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-loan-details',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
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
      this.loadLoanDetails(+loanId);
    } else {
      this.hasError = true;
      this.errorMessage = 'ID kredita nije prosleđen.';
      this.isLoading = false;
    }
  }

  private loadLoanDetails(loanId: number): void {
    this.isLoading = true;
    this.hasError = false;

    this.loanService.getLoanById(loanId).subscribe({
      next: (loan) => {
        this.loan = loan;
        this.loadInstallments(loanId);
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = err.error?.message || 'Greška pri učitavanju kredita.';
      }
    });
  }

  private loadInstallments(loanId: number): void {
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

  getLoanTypeLabel(type: string): string {
    return LoanTypeLabels[type as keyof typeof LoanTypeLabels] || type;
  }

  getInstallmentStatusLabel(status: InstallmentStatus): string {
    return InstallmentStatusLabels[status] || status;
  }

  getStatusBadgeClass(status: InstallmentStatus): string {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'UNPAID': return 'bg-orange-100 text-orange-700';
      case 'LATE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS');
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' ' + currency;
  }

  formatPercent(value: number): string {
    return value.toFixed(2) + '%';
  }
}
