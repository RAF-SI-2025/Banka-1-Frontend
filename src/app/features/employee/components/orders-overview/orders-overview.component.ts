import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import {
  OrderDirection,
  OrderFilter,
  OrderService,
  OrderStatus,
  resolveOrderExpiryDate,
} from '../../services/order.service';
import { ToastService } from '../../../../shared/services/toast.service';

interface TradingOrder {
  id: number;
  agent: string;
  orderType: string;
  assetType: string;
  quantity: number;
  contractSize: number;
  pricePerUnit: number;
  direction: OrderDirection;
  remainingPortions: number;
  status: OrderStatus;
  isDone: boolean;
  settlementDate?: string;
}

@Component({
  selector: 'app-orders-overview',
  templateUrl: './orders-overview.component.html',
  styleUrls: ['./orders-overview.component.css'],
})
export class OrdersOverviewComponent implements OnInit {
  orders: TradingOrder[] = [];
  selectedFilter: OrderFilter = 'PENDING';
  readonly filterOptions: { value: OrderFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'DECLINED', label: 'Declined' },
    { value: 'DONE', label: 'Done' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];
  isLoading = false;
  actionOrderId: number | null = null;

  currentPage = 0;
  readonly pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  cancelTarget: TradingOrder | null = null;
  cancelQuantityInput = '';

  constructor(
    private orderService: OrderService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  get filteredOrders(): TradingOrder[] {
    // Filtering is already done server-side via loadOrders(status, page, size).
    return this.orders;
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService
      .getOrders(this.selectedFilter, this.currentPage, this.pageSize)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          const pages = response.totalPages ?? 0;
          if (pages > 0 && this.currentPage >= pages) {
            this.currentPage = pages - 1;
            this.loadOrders();
            return;
          }
          this.totalElements = response.totalElements ?? 0;
          this.totalPages = pages;
          this.orders = (response.content ?? []).map((order) => ({
            id: order.orderId,
            agent: order.agentName,
            orderType: order.orderType,
            assetType: order.listingType,
            quantity: order.quantity,
            contractSize: order.contractSize,
            pricePerUnit: order.pricePerUnit,
            direction: order.direction,
            remainingPortions: order.remainingPortions,
            status: order.status,
            isDone: order.status === 'DONE',
            settlementDate: resolveOrderExpiryDate(order),
          }));
        },
        error: () => {
          this.orders = [];
          this.totalElements = 0;
          this.totalPages = 0;
          this.toastService.error('Failed to load orders. Please try again.');
        },
      });
  }

  setFilter(filter: OrderFilter): void {
    this.selectedFilter = filter;
    this.currentPage = 0;
    this.loadOrders();
  }

  goToPage(page: number): void {
    const last = Math.max(0, this.totalPages - 1);
    const next = Math.min(Math.max(0, page), last);
    if (next === this.currentPage) {
      return;
    }
    this.currentPage = next;
    this.loadOrders();
  }

  statusLabel(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      PENDING: 'Pending',
      APPROVED: 'Approved',
      DECLINED: 'Declined',
      DONE: 'Done',
      CANCELLED: 'Cancelled',
    };
    return map[status];
  }

  approveOrder(order: TradingOrder): void {
    this.actionOrderId = order.id;
    this.orderService
      .approveOrder(order.id)
      .pipe(finalize(() => (this.actionOrderId = null)))
      .subscribe({
        next: () => {
          this.toastService.success(`Order ${order.id} approved successfully.`);
          this.loadOrders();
        },
        error: () => this.toastService.error(`Failed to approve order ${order.id}.`),
      });
  }

  declineOrder(order: TradingOrder): void {
    this.actionOrderId = order.id;
    this.orderService
      .declineOrder(order.id)
      .pipe(finalize(() => (this.actionOrderId = null)))
      .subscribe({
        next: () => {
          this.toastService.success(`Order ${order.id} declined successfully.`);
          this.loadOrders();
        },
        error: () => this.toastService.error(`Failed to decline order ${order.id}.`),
      });
  }

  openCancelDialog(order: TradingOrder): void {
    this.cancelTarget = order;
    this.cancelQuantityInput = '';
  }

  closeCancelDialog(): void {
    this.cancelTarget = null;
    this.cancelQuantityInput = '';
  }

  confirmCancel(): void {
    if (!this.cancelTarget) {
      return;
    }
    const order = this.cancelTarget;
    const raw = this.cancelQuantityInput.trim();
    let quantity: number | undefined;

    if (raw !== '') {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > order.remainingPortions) {
        this.toastService.error(
          `Enter a whole number from 1 to ${order.remainingPortions}, or leave empty to cancel the full remaining amount.`,
        );
        return;
      }
      quantity = n;
    }

    this.actionOrderId = order.id;
    this.orderService
      .cancelOrder(order.id, quantity)
      .pipe(finalize(() => (this.actionOrderId = null)))
      .subscribe({
        next: () => {
          this.closeCancelDialog();
          this.toastService.success(`Order ${order.id} canceled successfully.`);
          this.loadOrders();
        },
        error: () => this.toastService.error(`Failed to cancel order ${order.id}.`),
      });
  }

  isExpired(order: TradingOrder): boolean {
    if (!order.settlementDate) return false;
    return new Date(order.settlementDate).getTime() < Date.now();
  }

  canApprove(order: TradingOrder): boolean {
    return (
      order.status === 'PENDING' &&
      !this.isExpired(order) &&
      this.actionOrderId !== order.id
    );
  }

  canDecline(order: TradingOrder): boolean {
    return order.status === 'PENDING' && this.actionOrderId !== order.id;
  }

  canCancel(order: TradingOrder): boolean {
    return (
      order.status === 'APPROVED' &&
      !order.isDone &&
      order.remainingPortions > 0 &&
      this.actionOrderId !== order.id
    );
  }

  trackById(index: number, order: TradingOrder): number {
    return order.id || index;
  }
}
