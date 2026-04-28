import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SecuritiesService } from '../../../securities/services/securities.service';
import { Security } from '../../../securities/models/security.model';
import { Account } from '../../../client/models/account.model';
import { AccountService } from '../../../client/services/account.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { OrderService } from '../../services/order.service';
import { OrderDirection, OrderResponse, OrderType } from '../../models/order.model';

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './create-order.component.html',
  styleUrls: ['./create-order.component.scss'],
})
export class CreateOrderComponent implements OnInit {
  direction: OrderDirection = 'BUY';
  listingId!: number;

  security: Security | null = null;
  accounts: Account[] = [];

  quantity = 1;
  limitValue: number | null = null;
  stopValue: number | null = null;
  allOrNone = false;
  margin = false;
  selectedAccountId: string | null = null;

  isLoading = true;
  isSubmitting = false;

  draftOrder: OrderResponse | null = null;
  showConfirmation = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly securitiesService: SecuritiesService,
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
    private readonly orderService: OrderService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.direction = this.route.snapshot.paramMap.get('direction') as OrderDirection;
    this.listingId = Number(this.route.snapshot.paramMap.get('listingId'));

    this.loadSecurity();
  }

  private loadSecurity(): void {
    this.isLoading = true;

    this.securitiesService.getSecurityById(this.listingId).subscribe({
      next: security => {
        this.security = security;
        this.loadAccounts();
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Greška pri učitavanju hartije od vrednosti.');
      },
    });
  }

  private loadAccounts(): void {
    if (!this.security) return;

    if (this.authService.isClient()) {
      this.accountService.getMyAccounts().subscribe({
        next: accounts => {
          this.accounts = accounts.filter(a => a.status === 'ACTIVE');
          this.selectedAccountId = this.accounts.length > 0 ? this.accounts[0].accountNumber : null;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.toastService.error('Greška pri učitavanju računa.');
        },
      });
      return;
    }

    this.accountService.getBankAccountByCurrency(this.security.currency).subscribe({
      next: account => {
        this.accounts = Array.isArray(account) ? account : (account ? [account] : []);
        this.selectedAccountId = this.accounts.length > 0 ? this.accounts[0].accountNumber : null;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Greška pri učitavanju bankinog računa.');
      },
    });
  }

  get orderType(): OrderType {
    if (!this.limitValue && !this.stopValue) return 'MARKET';
    if (this.limitValue && !this.stopValue) return 'LIMIT';
    if (!this.limitValue && this.stopValue) return 'STOP';
    return 'STOP_LIMIT';
  }

  get pricePerUnit(): number {
    if (!this.security) return 0;

    if (this.orderType === 'LIMIT' || this.orderType === 'STOP_LIMIT') {
      return Number(this.limitValue ?? 0);
    }

    if (this.orderType === 'STOP') {
      return Number(this.stopValue ?? 0);
    }

    const anySecurity = this.security as any;

    if (this.direction === 'BUY') {
      return Number(this.security.ask ?? this.security.price);
    }

    return Number(this.security.bid ?? this.security.price);
  }

  get contractSize(): number {
    return Number((this.security as any)?.contractSize ?? 1);
  }

  get approximatePrice(): number {
    return this.contractSize * this.pricePerUnit * this.quantity;
  }

  get estimatedFee(): number {
    if (!this.security || this.security.type === 'FOREX') return 0;

    const marketFamily = this.orderType === 'MARKET' || this.orderType === 'STOP';
    const percentFee = this.approximatePrice * (marketFamily ? 0.14 : 0.24);
    const maxFee = marketFamily ? 7 : 12;

    return Math.min(percentFee, maxFee);
  }

  get selectedAccount(): Account | null {
    return this.accounts.find(a => a.accountNumber === this.selectedAccountId) ?? null;
  }

  get canSubmit(): boolean {
    return !!this.security
      && this.quantity > 0
      && !!this.selectedAccountId
      && this.pricePerUnit > 0;
  }

  createDraftOrder(): void {
    if (!this.canSubmit || !this.security) return;

    this.isSubmitting = true;

    const payload = {
      listingId: this.listingId,
      quantity: this.quantity,
      limitValue: this.limitValue || null,
      stopValue: this.stopValue || null,
      allOrNone: this.allOrNone,
      margin: this.margin,
      accountId: this.authService.isClient() ? this.selectedAccountId : null,
      bankAccountId: this.authService.isClient() ? null : this.selectedAccountId,
    };

    const request$ = this.direction === 'BUY'
      ? this.orderService.createBuyOrder(payload)
      : this.orderService.createSellOrder(payload);

    request$.subscribe({
      next: order => {
        this.draftOrder = order;
        this.showConfirmation = true;
        this.isSubmitting = false;
      },
      error: err => {
        this.isSubmitting = false;
        this.toastService.error(err?.error?.message ?? 'Greška pri kreiranju ordera.');
      },
    });
  }

  confirmOrder(): void {
    if (!this.draftOrder) return;

    this.isSubmitting = true;

    this.orderService.confirmOrder(this.draftOrder.id).subscribe({
      next: order => {
        this.isSubmitting = false;
        this.showConfirmation = false;
        this.toastService.success('Order je uspešno potvrđen.');
        this.router.navigate(['/securities']);
      },
      error: err => {
        this.isSubmitting = false;
        this.toastService.error(err?.error?.message ?? 'Greška pri potvrdi ordera.');
      },
    });
  }

  cancelDraft(): void {
    if (!this.draftOrder) {
      this.showConfirmation = false;
      return;
    }

    this.orderService.cancelOrder(this.draftOrder.id).subscribe({
      next: () => {
        this.showConfirmation = false;
        this.draftOrder = null;
      },
      error: err => {
        this.toastService.error(err?.error?.message ?? 'Greška pri otkazivanju ordera.');
        this.showConfirmation = false;
        this.draftOrder = null;
      },
    });
  }

  formatMoney(value: number | null | undefined): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  }
}
