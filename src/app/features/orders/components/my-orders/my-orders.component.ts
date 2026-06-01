import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MyOrderResponse,
  OrderStatus,
  OrderType,
} from '../../models/order.model';
import { OrderService, MyOrdersPageRequest } from '../../services/order.service';

type SecurityTypeFilter = 'ALL' | 'STOCK' | 'FUTURE' | 'FOREX' | 'OPTION';
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

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  readonly statusOptions: { value: OrderStatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Svi statusi' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PENDING_CONFIRMATION', label: 'Na čekanju' },
    { value: 'APPROVED', label: 'Odobren' },
    { value: 'DECLINED', label: 'Odbijen' },
    { value: 'DONE', label: 'Završen' },
    { value: 'CANCELLED', label: 'Otkazan' },
  ];

  readonly securityTypeOptions: { value: SecurityTypeFilter; label: string }[] = [
    { value: 'ALL', label: 'Sve hartije' },
    { value: 'STOCK', label: 'Akcije' },
    { value: 'FUTURE', label: 'Fjučersi' },
    { value: 'FOREX', label: 'Forex' },
    { value: 'OPTION', label: 'Opcije' },
  ];

  constructor(private readonly orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  get filteredOrders(): MyOrderView[] {
    // All filtering is now done server-side via pagination
    return this.orders;
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const request: MyOrdersPageRequest = {
      status: this.selectedStatus === 'ALL' ? '' : this.selectedStatus,
      listingType: this.selectedSecurityType === 'ALL' ? '' : this.selectedSecurityType,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      page: this.currentPage,
      size: this.pageSize,
    };

    this.orderService.getMyOrdersPaged(request).subscribe({
      next: (response) => {
        this.orders = response.content.map((order) => this.mapOrder(order));
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.isLoading = false;
      },
      error: () => {
        this.orders = [];
        this.errorMessage = 'Greška pri učitavanju ordera.';
        this.isLoading = false;
      },
    });
  }

  onFilterChange(): void {
    this.currentPage = 0; // Reset to first page when filters change
    this.loadOrders();
  }

  clearFilters(): void {
    this.selectedStatus = 'ALL';
    this.selectedSecurityType = 'ALL';
    this.dateFrom = '';
    this.dateTo = '';
    this.currentPage = 0;
    this.loadOrders();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(0, this.currentPage - 2);
    const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
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
      PENDING_CONFIRMATION: 'Na čekanju',
      PENDING: 'Pending',
      APPROVED: 'Odobren',
      DECLINED: 'Odbijen',
      DONE: 'Završen',
      CANCELLED: 'Otkazan',
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
