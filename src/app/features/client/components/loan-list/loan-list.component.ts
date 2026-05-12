import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Loan, LoanStatus, LoanTypeLabels } from '../../models/loan.model';
import { LoanService } from '../../services/loan.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
// PR_31 T11: shared StateComponent za loading/empty/error markup.
import { StateComponent } from '../../../../shared/components/state/state.component';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [CommonModule, StateComponent],
  templateUrl: './loan-list.component.html',
  styleUrls: ['./loan-list.component.scss']
})
export class LoanListComponent implements OnInit, OnDestroy {
  loans: Loan[] = [];
  isLoading = false;
  error: string | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly loanService: LoanService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadLoans();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all loans for the current user
   */
  loadLoans(): void {
    this.isLoading = true;
    this.error = null;

    this.loanService
      .getMyLoans()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (loans) => {
          // Spec Celina 2: lista kredita sortirana opadajuce po ukupnom iznosu kredita.
          this.loans = [...loans].sort(
            (a, b) => (b?.amount ?? 0) - (a?.amount ?? 0)
          );
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading loans:', err);
          this.error = 'Greška pri učitavanju kredita. Molimo pokušajte ponovo.';
          this.isLoading = false;
        }
      });
  }

  getLoanTypeLabel(type: string | undefined): string {
    if (!type) return 'Nepoznati tip';
    return LoanTypeLabels[type as keyof typeof LoanTypeLabels] || type;
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Nepoznato';
    switch (status) {
      case 'APPROVED': return 'Odobren';
      case 'OVERDUE': return 'Kasni';
      case 'REPAID': return 'Otplaćen';
      case 'REJECTED': return 'Odbijen';
      default: return status;
    }
  }

  getStatusBadgeClass(status: string | undefined): string {
    if (!status) return 'badge-default';
    switch (status) {
      case 'APPROVED': return 'badge-approved';
      case 'OVERDUE': return 'badge-overdue';
      case 'REPAID': return 'badge-repaid';
      case 'REJECTED': return 'badge-rejected';
      default: return 'bg-gray-100 text-gray-800';
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

  formatDate(dateString: string | undefined): string {
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

  viewLoanDetails(loanId: string | number | undefined): void {
    if (loanId !== undefined) {
      // Stavili smo tačnu apsolutnu putanju sa kosom crtom na početku
      this.router.navigate(['/home/loans', loanId]);
    }
  }

  // Dodali smo ovu novu funkciju da sprečimo grešku u HTML-u oko izračunavanja procenta za progress bar
  calculateProgress(remaining: number | undefined, total: number | undefined): number {
    const rem = remaining || 0;
    const tot = total || 1; // Ako je total nedefinisan, stavljamo 1 da izbegnemo deljenje sa nulom
    if (tot === 0) return 0;
    return (rem / tot) * 100;
  }

  /**
   * Navigate to loan request form
   */
  requestNewLoan(): void {
    this.router.navigate(['/loans/request']);
  }
}
