import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { OrderService } from '../../services/order.service';
import {
  MyOrder,
  MyOrderStatusFilter,
  MyOrderTypeFilter,
  SecurityTypeFilter,
} from '../../models/order.model';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss'],
})
export class MyOrdersComponent implements OnInit {
  orders: MyOrder[] = [];

  isLoading = false;

  selectedStatus: MyOrderStatusFilter = 'ALL';
  selectedSecurityType: SecurityTypeFilter = 'ALL';
  selectedOrderType: MyOrderTypeFilter = 'ALL';

  dateFrom = '';
  dateTo = '';

  readonly statusOptions: { value: MyOrderStatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Svi statusi' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'DECLINED', label: 'Declined' },
    { value: 'DONE', label: 'Done' },
  ];

  readonly securityTypeOptions: { value: SecurityTypeFilter; label: string }[] = [
    { value: 'ALL', label: 'Sve hartije' },
    { value: 'STOCK', label: 'Stock' },
    { value: 'FOREX', label: 'Forex' },
    { value: 'FUTURES', label: 'Futures' },
    { value: 'OPTION', label: 'Option' },
  ];

  readonly orderTypeOptions: { value: MyOrderTypeFilter; label: string }[] = [
    { value: 'ALL', label: 'Svi tipovi' },
    { value: 'MARKET', label: 'Market' },
    { value: 'LIMIT', label: 'Limit' },
    { value: 'STOP', label: 'Stop' },
    { value: 'STOP_LIMIT', label: 'Stop-Limit' },
  ];

  constructor(
    private readonly orderService: OrderService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;

    this.orderService
      .getMyOrders()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: orders => {
          this.orders = orders;
        },
        error: () => {
          this.orders = [];
          this.toastService.error('Greška pri učitavanju ordera.');
        },
      });
  }

  get filteredOrders(): MyOrder[] {
    return this.orders.filter(order => {
      const matchesStatus =
        this.selectedStatus === 'ALL' || order.status === this.selectedStatus;

      const matchesSecurityType =
        this.selectedSecurityType === 'ALL' ||
        order.securityType === this.selectedSecurityType;

      const matchesOrderType =
        this.selectedOrderType === 'ALL' ||
        order.orderType === this.selectedOrderType;

      const createdDate = order.createdAt ? new Date(order.createdAt) : null;

      const matchesDateFrom =
        !this.dateFrom ||
        (createdDate !== null && createdDate >= new Date(this.dateFrom));

      const matchesDateTo =
        !this.dateTo ||
        (createdDate !== null && createdDate <= this.endOfDay(this.dateTo));

      return (
        matchesStatus &&
        matchesSecurityType &&
        matchesOrderType &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }

  clearFilters(): void {
    this.selectedStatus = 'ALL';
    this.selectedSecurityType = 'ALL';
    this.selectedOrderType = 'ALL';
    this.dateFrom = '';
    this.dateTo = '';
  }

  getOrderTypeLabel(type: string): string {
    const map: Record<string, string> = {
      MARKET: 'Market',
      LIMIT: 'Limit',
      STOP: 'Stop',
      STOP_LIMIT: 'Stop-Limit',
    };

    return map[type] ?? type;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pending',
      PENDING_CONFIRMATION: 'Pending',
      APPROVED: 'Approved',
      DECLINED: 'Declined',
      DONE: 'Done',
      CANCELLED: 'Cancelled',
    };

    return map[status] ?? status;
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'z-badge-yellow',
      PENDING_CONFIRMATION: 'z-badge-yellow',
      APPROVED: 'z-badge-blue',
      DECLINED: 'z-badge-red',
      DONE: 'z-badge-green',
      CANCELLED: 'z-badge-gray',
    };

    return map[status] ?? 'z-badge-gray';
  }

  formatDate(date?: string | null): string {
    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatMoney(value?: number | null): string {
    if (value === null || value === undefined) {
      return '-';
    }

    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  trackById(index: number, order: MyOrder): number {
    return order.id || index;
  }

  private endOfDay(date: string): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }
}
