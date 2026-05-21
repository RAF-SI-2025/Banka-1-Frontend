import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MyOrderResponse,
  OrderStatus,
  OrderType,
} from '../../models/order.model';
import { OrderService } from '../../services/order.service';

type SecurityTypeFilter = 'ALL' | 'STOCK' | 'FUTURE' | 'FOREX';
type OrderStatusFilter = 'ALL' | OrderStatus;

interface MyOrderView {
  id: number;
  orderType: OrderType;
  ticker: string;
  securityName: string;
  securityType: SecurityTypeFilter;
  quantity: number;
  executionPrice: number | null;
  status: OrderStatus;
  createdAt: string | null;
  executedAt: string | null;
  paidFee: number | null;
}

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss'],
})
export class MyOrdersComponent implements OnInit {
  orders: MyOrderView[] = [];
  isLoading = false;
  errorMessage = '';

  selectedStatus: OrderStatusFilter = 'ALL';
  selectedSecurityType: SecurityTypeFilter = 'ALL';
  dateFrom = '';
  dateTo = '';

  readonly statusOptions: { value: OrderStatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Svi statusi' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PENDING_CONFIRMATION', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'DECLINED', label: 'Declined' },
    { value: 'DONE', label: 'Done' },
  ];

  readonly securityTypeOptions: { value: SecurityTypeFilter; label: string }[] = [
    { value: 'ALL', label: 'Sve hartije' },
    { value: 'STOCK', label: 'Akcije' },
    { value: 'FUTURE', label: 'Fjučersi' },
    { value: 'FOREX', label: 'Forex' },
  ];

  constructor(private readonly orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  get filteredOrders(): MyOrderView[] {
    return this.orders.filter((order) => {
      const matchesStatus =
        this.selectedStatus === 'ALL' || order.status === this.selectedStatus;

      const matchesSecurityType =
        this.selectedSecurityType === 'ALL' ||
        order.securityType === this.selectedSecurityType;

      const createdDate = order.createdAt ? new Date(order.createdAt) : null;

      const matchesDateFrom =
        !this.dateFrom ||
        !createdDate ||
        createdDate >= new Date(`${this.dateFrom}T00:00:00`);

      const matchesDateTo =
        !this.dateTo ||
        !createdDate ||
        createdDate <= new Date(`${this.dateTo}T23:59:59`);

      return (
        matchesStatus &&
        matchesSecurityType &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders.map((order) => this.mapOrder(order));
        this.isLoading = false;
      },
      error: () => {
        this.orders = [];
        this.errorMessage = 'Greška pri učitavanju ordera.';
        this.isLoading = false;
      },
    });
  }

  clearFilters(): void {
    this.selectedStatus = 'ALL';
    this.selectedSecurityType = 'ALL';
    this.dateFrom = '';
    this.dateTo = '';
  }

  getOrderTypeLabel(type: OrderType): string {
    const labels: Record<OrderType, string> = {
      MARKET: 'Market',
      LIMIT: 'Limit',
      STOP: 'Stop',
      STOP_LIMIT: 'Stop-Limit',
    };

    return labels[type] ?? type;
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      PENDING_CONFIRMATION: 'Pending',
      PENDING: 'Pending',
      APPROVED: 'Approved',
      DECLINED: 'Declined',
      DONE: 'Done',
      CANCELLED: 'Cancelled',
    };

    return labels[status] ?? status;
  }

  getStatusBadgeClass(status: OrderStatus): string {
    if (status === 'APPROVED' || status === 'DONE') {
      return 'status-success';
    }

    if (status === 'DECLINED' || status === 'CANCELLED') {
      return 'status-danger';
    }

    return 'status-warning';
  }

  formatMoney(value: number | null): string {
    if (value === null || value === undefined) {
      return '-';
    }

    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  trackById(index: number, order: MyOrderView): number {
    return order.id || index;
  }

  private mapOrder(order: MyOrderResponse): MyOrderView {
    const anyOrder = order as any;
    const listing = anyOrder.listing ?? anyOrder.security ?? {};

    return {
      id: order.id,
      orderType: order.orderType,
      ticker:
        anyOrder.ticker ??
        anyOrder.securityTicker ??
        anyOrder.listingTicker ??
        listing.ticker ??
        '-',
      securityName:
        anyOrder.securityName ??
        anyOrder.listingName ??
        listing.name ??
        '-',
      securityType:
        anyOrder.securityType ??
        listing.securityType ??
        listing.type ??
        'ALL',
      quantity: order.quantity,
      executionPrice:
        anyOrder.executionPrice ??
        anyOrder.executedPrice ??
        order.pricePerUnit ??
        order.approximatePrice ??
        null,
      status: order.status,
      createdAt:
        anyOrder.createdAt ??
        anyOrder.creationDate ??
        anyOrder.createdDate ??
        order.lastModification ??
        null,
      executedAt:
        anyOrder.executedAt ??
        anyOrder.executionDate ??
        anyOrder.doneAt ??
        null,
      paidFee:
        anyOrder.paidFee ??
        anyOrder.commission ??
        order.fee ??
        null,
    };
  }
}
