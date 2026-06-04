import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaxService } from '../../services/tax.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { TaxUser, TaxUserDisplay, TaxUserPage } from '../../models/tax-user.model';
import { AppPaginationComponent } from '../../../../shared/components/pagination/pagination.component';


@Component({
  selector: 'app-tax-tracking',
  templateUrl: './tax-tracking.component.html',
  styleUrls: ['./tax-tracking.component.css'],
  standalone: true, 
  imports: [CommonModule, FormsModule, AppPaginationComponent], 
})
export class TaxTrackingComponent implements OnInit {
  
  users: TaxUserDisplay[] = [];
  filteredUsers: TaxUserDisplay[] = [];
  
  searchTerm: string = '';
  userTypeFilter: 'ALL' | 'CLIENT' | 'ACTUARY' = 'ALL';

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  
  isLoading: boolean = false;
  isProcessing: boolean = false;
  isCurrentMonthProcessing: boolean = false;

  constructor(private taxService: TaxService, private toastService: ToastService) {}
  
  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    const userType = this.userTypeFilter === 'ALL' ? undefined : this.userTypeFilter;

    this.taxService.getTaxDebtors(this.currentPage, this.pageSize, userType).subscribe({
      next: (response: TaxUserPage) => {
        // Backend vraća Page objekat, podaci su u 'content'
        const taxUsers: TaxUser[] = response.content || [];
        this.totalElements = response.totalElements ?? taxUsers.length;
        this.totalPages = response.totalPages ?? 0;
        this.currentPage = response.number ?? this.currentPage;
        this.pageSize = response.size ?? this.pageSize;
        // Mapujem backend podatke na display format
        this.users = taxUsers.map(user => ({
          firstName: user.firstName,
          lastName: user.lastName,
          type: user.userType,
          baseAmount: 0, // Backend ne vraća osnovicu
          taxDebt: user.taxDebtRsd, // Mapujem taxDebtRsd na taxDebt
          lastTaxCalculationDate: user.lastTaxCalculationDate,
          currentMonthTax: user.currentMonthTaxRsd,
          totalPaidTax: user.totalPaidTaxRsd,
          status: user.status,
        }));
        this.filterData();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Greška pri učitavanju:', err);
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadData();
  }

  onPageChange(page: number): void {
    if (page < 0 || page === this.currentPage || (this.totalPages > 0 && page >= this.totalPages)) {
      return;
    }

    this.currentPage = page;
    this.loadData();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadData();
  }

  getLastItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  filterData(): void {
    this.filteredUsers = this.users.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(this.searchTerm.toLowerCase().trim());
      const matchesType = this.userTypeFilter === 'ALL' || user.type === this.userTypeFilter;
      return matchesSearch && matchesType;
    });
  }

  getStatusLabel(status: TaxUserDisplay['status']): string {
    switch (status) {
      case 'PENDING':
        return 'Na cekanju';
      case 'PAID':
        return 'Placeno';
      case 'PARTIALLY_PAID':
        return 'Delimicno placeno';
      case 'FAILED':
        return 'Neuspesno';
      default:
        return 'Aktivan';
    }
  }

  getStatusClass(status: TaxUserDisplay['status']): string {
    switch (status) {
      case 'PENDING':
        return 'z-badge-gold';
      case 'PAID':
        return 'z-badge-green';
      case 'PARTIALLY_PAID':
        return 'z-badge-blue';
      case 'FAILED':
        return 'z-badge-red';
      default:
        return 'z-badge-blue';
    }
  }

  startTaxCalculation(): void {
      this.isProcessing = true;
      
      this.taxService.triggerTaxCalculation().subscribe({
        next: () => {
          this.toastService.success('Obračun poreza je uspešno pokrenut i naplaćen.');
          this.currentPage = 0;
          this.loadData(); 
          this.isProcessing = false;
        },
        error: (err: any) => {
          console.error('Greška pri obračunu:', err);
          this.toastService.error('Greška pri obračunu poreza.');
          this.isProcessing = false;
        }
      });
    
  }

  startCurrentMonthTaxCalculation(): void {
    this.isCurrentMonthProcessing = true;

    this.taxService.triggerCurrentMonthTaxCalculation().subscribe({
      next: () => {
        this.toastService.success('Obračun poreza za ovaj mesec je uspešno pokrenut i naplaćen.');
        this.currentPage = 0;
        this.loadData();
        this.isCurrentMonthProcessing = false;
      },
      error: (err: any) => {
        console.error('Greška pri obračunu za ovaj mesec:', err);
        this.toastService.error('Greška pri obračunu poreza za ovaj mesec.');
        this.isCurrentMonthProcessing = false;
      }
    });
  }
}
