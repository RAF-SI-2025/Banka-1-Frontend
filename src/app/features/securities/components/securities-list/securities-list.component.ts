import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject, combineLatest, interval } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { AuthService } from '../../../../core/services/auth.service';
import { SecuritiesService } from '../../services/securities.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ExchangeManagerService } from '../../../employee/services/exchange-manager.service';
import { ExchangeService } from '../../../../shared/services/exchange.service';
import {
  Security,
  Stock,
  Future,
  Forex,
  SecuritiesFilters,
  SecuritiesPage,
  SortConfig,
  SortField,
} from '../../models/security.model';

type SecurityTab = 'stocks' | 'futures' | 'forex';

@Component({
  selector: 'app-securities-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './securities-list.component.html',
  styleUrls: ['./securities-list.component.scss'],
})
export class SecuritiesListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  activeTab: SecurityTab = 'stocks';
  isClient = false;
  useMockData = false;

  securities: Security[] = [];
  isLoading = false;
  errorMessage = '';

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  filters: SecuritiesFilters = {};
  draftFilters: SecuritiesFilters = {};
  isFilterOpen = false;

  sortConfig: SortConfig = { field: 'ticker', direction: 'asc' };

  searchQuery = '';

  constructor(
    private readonly securitiesService: SecuritiesService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly toastService: ToastService,
    private readonly exchangeService: ExchangeService,
    private readonly exchangeManager: ExchangeManagerService
  ) {}

  ngOnInit(): void {
    this.isClient = this.authService.isClient();

    // Auto-refresh every 60 seconds
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadSecurities());

    // Pretplati se na promene mock/live režima - automatski učita nove podatke
    // BehaviorSubject odmah emituje, što će pozvati loadSecurities() i učitati podatke
    this.exchangeManager.useMockData$.pipe(takeUntil(this.destroy$)).subscribe(isMock => {
      this.useMockData = isMock;
      this.currentPage = 0; // Reset na prvu stranicu
      this.loadSecurities(); // Učitaj podatke
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: SecurityTab): void {
    if (tab === 'forex' && this.isClient) return;
    this.activeTab = tab;
    this.clearFilters();
  }

  onSearchChange(): void {
    this.filters.search = this.searchQuery;
    this.currentPage = 0;
    this.loadSecurities();
  }

  refreshSecurities(): void {
    this.isLoading = true;
    this.securitiesService.refreshAllStocks().pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadSecurities(),
      error: () => {
        this.toastService.error('Greška pri osvežavanju podataka.');
        this.isLoading = false;
      }
    });
  }

  toggleMockData(): void {
    this.exchangeManager.toggleMockData();
  }

  loadSecurities(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Automatski dodaj dostupne berze kao filter da se ne prikazuju hartije sa nepostojeći berzama
    const availableMICCodes = this.exchangeManager.getAvailableExchangeCodes().join(',');
    const filtersWithExchange = {
      ...this.filters,
      exchange: availableMICCodes
    };

    let request$: Observable<SecuritiesPage<Security>>;
    switch (this.activeTab) {
      case 'stocks':
        // Use client-specific endpoint for stock clients
        if (this.isClient) {
          request$ = this.securitiesService.getClientStocks(
            filtersWithExchange,
            this.currentPage,
            this.pageSize,
            this.sortConfig
          );
        } else {
          request$ = this.securitiesService.getStocks(
            filtersWithExchange,
            this.currentPage,
            this.pageSize,
            this.sortConfig
          );
        }
        break;
      case 'futures':
        request$ = this.securitiesService.getFutures(
          filtersWithExchange,
          this.currentPage,
          this.pageSize,
          this.sortConfig
        );
        break;
      case 'forex':
        request$ = this.securitiesService.getForex(
          filtersWithExchange,
          this.currentPage,
          this.pageSize,
          this.sortConfig
        );
        break;
    }

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (page: SecuritiesPage<Security>) => {
        // Koristi direktno podatke iz backend-a bez dodatnog filtriranja
        // Backend je već filtrirao po dostupnim berzama ako je potrebno
        this.securities = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Error loading securities:', err);
        this.errorMessage = 'Greška pri učitavanju hartija od vrednosti.';
        this.isLoading = false;
      },
    });
  }

  toggleFilterPanel(): void {
    this.isFilterOpen = !this.isFilterOpen;
    if (this.isFilterOpen) {
      this.syncDraftFilters();
    }
  }

  closeFilterPanel(): void {
    this.isFilterOpen = false;
  }

  applyFilters(): void {
    const f = this.draftFilters;
    if (f.priceMin !== undefined && f.priceMax !== undefined && f.priceMin > f.priceMax) {
      this.toastService.error('Minimalna cena ne može biti veća od maksimalne.');
      return;
    }
    if (f.volumeMin !== undefined && f.volumeMax !== undefined && f.volumeMin > f.volumeMax) {
      this.toastService.error('Minimalni volumen ne može biti veći od maksimalnog.');
      return;
    }
    if (f.marginMin !== undefined && f.marginMax !== undefined && f.marginMin > f.marginMax) {
      this.toastService.error('Minimalna marža ne može biti veća od maksimalne.');
      return;
    }
    if (f.bidMin !== undefined && f.bidMax !== undefined && f.bidMin > f.bidMax) {
      this.toastService.error('Minimalni bid ne može biti veći od maksimalnog.');
      return;
    }
    if (f.askMin !== undefined && f.askMax !== undefined && f.askMin > f.askMax) {
      this.toastService.error('Minimalni ask ne može biti veći od maksimalnog.');
      return;
    }
    if (f.settlementDateFrom && f.settlementDateTo && f.settlementDateFrom > f.settlementDateTo) {
      this.toastService.error('Datum izmirenja "od" ne može biti posle datuma "do".');
      return;
    }
    this.filters = { ...f, search: this.searchQuery };
    this.currentPage = 0;
    this.loadSecurities();
    this.closeFilterPanel();
  }

  clearFilters(): void {
    this.filters = { search: this.searchQuery };
    this.draftFilters = {};
    this.currentPage = 0;
    this.loadSecurities();
    this.closeFilterPanel();
  }

  toggleSort(field: SortField): void {
    if (this.sortConfig.field === field) {
      this.sortConfig.direction =
        this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig = { field, direction: 'asc' };
    }
    this.loadSecurities();
  }

  getSortIcon(field: SortField): string {
    if (this.sortConfig.field !== field) return '';
    return this.sortConfig.direction === 'asc' ? '↑' : '↓';
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadSecurities();
    }
  }

  getLastItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  /**
   * F1/F8: Buy security button click handler
   * TODO: When F1 (OrderModal) is implemented, replace console.log with modal open:
   *
   * this.dialog.open(OrderModalComponent, {
   *   data: {
   *     mode: 'BUY',
   *     securityType: this.activeTab.toUpperCase(), // 'STOCKS' | 'FUTURES' | 'FOREX'
   *     security: security,
   *     afterHoursWarning: status.isAfterHours
   *   }
   * });
   */
  onBuy(security: Security, event: Event): void {
    event.stopPropagation();

    // Check after-hours status before proceeding (F11)
    this.exchangeService.checkAfterHoursByMicCode(security.exchange)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          if (status.isAfterHours && status.message) {
            this.toastService.warning(status.message);
          }
          // TODO: Open OrderModalComponent here (F1)
          console.log('Buy clicked:', security.ticker, 'After-hours:', status.isAfterHours);
        },
        error: (err) => {
          console.error('Error checking exchange status:', err);
          // Proceed anyway if status check fails
          console.log('Buy clicked:', security.ticker);
        }
      });
  }

  onRowClick(security: Security): void {
    const type = this.activeTab === 'stocks' ? 'stock' : this.activeTab === 'futures' ? 'future' : 'forex';
    this.router.navigate(['/securities', type, security.id]);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  formatVolume(volume: number): string {
    return new Intl.NumberFormat('sr-RS').format(volume);
  }

  formatChange(change: number, changePercent: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  }

  getChangeClass(change: number): string {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  }

  trackBySecurity(index: number, security: Security): number {
    return security.id;
  }

  // Futures specific
  asFuture(security: Security): Future {
    return security as Future;
  }

  // Forex specific
  asForex(security: Security): Forex {
    return security as Forex;
  }

  private syncDraftFilters(): void {
    this.draftFilters = { ...this.filters };
    delete this.draftFilters.search;
  }
}
