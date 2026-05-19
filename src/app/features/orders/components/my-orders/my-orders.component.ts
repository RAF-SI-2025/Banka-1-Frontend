import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { StateComponent } from '../../../../shared/components/state/state.component';
import { AppPaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { MyOrderService } from '../../services/my-order.service';
import {
  MyOrder,
  MyOrderFilter,
  MyOrderPage,
} from '../../models/my-order.model';
import { OrderDirection, OrderStatus } from '../../models/order.model';

/**
 * WP-22 (Celina 3): "Moji orderi" — the caller's own order history page.
 *
 * <p>Server-paginated `z-table` of every order the logged-in trader created,
 * showing the order type, the security (ticker + name), the quantity and
 * execution price, the status, the creation + last-modification dates and the
 * paid brokerage commission (`fee`). A filter bar narrows the list by status,
 * direction, security type and a creation-date range.
 *
 * <p>Reachable by every authenticated trader — clients with trading and
 * actuary agents — via the lazy `orders/my` route. Standalone, lazy-loaded so
 * it stays out of the initial bundle.
 */

interface SelectOption<T> {
  value: T;
  label: string;
}

/** Empty sentinel for the "no filter" select option. */
const ALL = '';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, StateComponent, AppPaginationComponent],
  templateUrl: './my-orders.component.html',
})
export class MyOrdersComponent implements OnInit {
  orders: MyOrder[] = [];
  totalElements = 0;
  pageSize = 10;
  /** 0-indexed page number (matches the backend `PagedModel`). */
  currentPage = 0;

  isLoading = true;
  error: string | null = null;

  /* Filter-bar model. `''` means "no filter" for that field. */
  statusFilter: OrderStatus | '' = ALL;
  directionFilter: OrderDirection | '' = ALL;
  securityTypeFilter = ALL;
  fromDate = '';
  toDate = '';

  readonly statusOptions: SelectOption<OrderStatus | ''>[] = [
    { value: ALL, label: 'Svi statusi' },
    { value: 'PENDING_CONFIRMATION', label: 'Ceka potvrdu' },
    { value: 'PENDING', label: 'Na cekanju' },
    { value: 'APPROVED', label: 'Odobren' },
    { value: 'DECLINED', label: 'Odbijen' },
    { value: 'DONE', label: 'Izvrsen' },
    { value: 'CANCELLED', label: 'Otkazan' },
  ];

  readonly directionOptions: SelectOption<OrderDirection | ''>[] = [
    { value: ALL, label: 'Svi smerovi' },
    { value: 'BUY', label: 'Kupovina' },
    { value: 'SELL', label: 'Prodaja' },
  ];

  readonly securityTypeOptions: SelectOption<string>[] = [
    { value: ALL, label: 'Sve hartije' },
    { value: 'STOCK', label: 'Akcije' },
    { value: 'FUTURE', label: 'Fjucersi' },
    { value: 'FOREX', label: 'Forex' },
    { value: 'OPTION', label: 'Opcije' },
  ];

  constructor(private readonly myOrderService: MyOrderService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = null;
    this.myOrderService
      .getMyOrders(this.buildFilter(), this.currentPage, this.pageSize)
      .subscribe({
        next: (page: MyOrderPage) => {
          this.orders = page?.content ?? [];
          this.totalElements = page?.page?.totalElements ?? 0;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.error = 'Greska pri ucitavanju ordera.';
        },
      });
  }

  /** Applies the current filter bar, resetting to the first page. */
  applyFilters(): void {
    this.currentPage = 0;
    this.load();
  }

  /** Clears every filter field and reloads. */
  clearFilters(): void {
    this.statusFilter = ALL;
    this.directionFilter = ALL;
    this.securityTypeFilter = ALL;
    this.fromDate = '';
    this.toDate = '';
    this.currentPage = 0;
    this.load();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.load();
  }

  /**
   * Builds the {@link MyOrderFilter} from the filter-bar model. Only the
   * fields that actually have a value are included — an unset field is left
   * off the object entirely rather than set to `undefined`.
   */
  private buildFilter(): MyOrderFilter {
    const filter: MyOrderFilter = {};
    if (this.statusFilter) {
      filter.status = this.statusFilter;
    }
    if (this.directionFilter) {
      filter.direction = this.directionFilter;
    }
    if (this.securityTypeFilter) {
      filter.securityType = this.securityTypeFilter;
    }
    if (this.fromDate) {
      filter.from = this.fromDate;
    }
    if (this.toDate) {
      filter.to = this.toDate;
    }
    return filter;
  }

  statusBadgeClass(status: OrderStatus): string {
    switch (status) {
      case 'DONE':
      case 'APPROVED':
        return 'z-badge z-badge-green';
      case 'PENDING':
      case 'PENDING_CONFIRMATION':
        return 'z-badge z-badge-yellow';
      case 'DECLINED':
      case 'CANCELLED':
        return 'z-badge z-badge-red';
      default:
        return 'z-badge z-badge-gray';
    }
  }

  statusLabel(status: OrderStatus): string {
    return (
      this.statusOptions.find((o) => o.value === status)?.label ?? status
    );
  }

  directionLabel(direction: OrderDirection): string {
    return direction === 'BUY' ? 'Kupovina' : 'Prodaja';
  }

  trackByOrder(_: number, order: MyOrder): number {
    return order.id;
  }
}
