import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SecuritiesService } from '../../../securities/services/securities.service';
import { Security } from '../../../securities/models/security.model';
import { Account } from '../../../client/models/account.model';
import { AccountService } from '../../../client/services/account.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { NotificationType } from '../../../../shared/models/notification.model';
import { OrderService } from '../../services/order.service';
import { OrderDirection, OrderResponse, OrderType, PurchaseFor } from '../../models/order.model';
import { PortfolioService } from '../../../client/services/portfolio.service';
import { FundService } from '../../../funds/services/fund.service';
import { InvestmentFund } from '../../../funds/models/fund.model';

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  selectedAccountId: number | null = null;

  isLoading = true;
  isSubmitting = false;

  draftOrder: OrderResponse | null = null;
  showConfirmation = false;

  /** Spec Sc 37: korisnik ne moze prodati vise nego sto poseduje. 0 = ucitavanje. */
  public maxSellQuantity = 0;

  isSupervisor = false;
  purchaseFor: PurchaseFor = 'BANK';
  supervisedFunds: InvestmentFund[] = [];
  selectedFundId: number | null = null;
  isResolvingFundAccount = false;
  fundAccountError: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly securitiesService: SecuritiesService,
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
    private readonly orderService: OrderService,
    private readonly toastService: ToastService,
    private readonly portfolioService: PortfolioService,
    private readonly fundService: FundService,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.direction = this.route.snapshot.paramMap.get('direction') as OrderDirection;
    this.listingId = Number(this.route.snapshot.paramMap.get('listingId'));
    this.isSupervisor = this.authService.hasPermission('FUND_AGENT_MANAGE');

    this.loadSecurity();

    if (this.direction === 'SELL') {
      this.loadSellableQuantity();
    }
    if (this.isSupervisor && this.direction === 'BUY') {
      this.loadSupervisedFunds();
    }
  }

  private loadSupervisedFunds(): void {
    this.fundService.supervised().subscribe({
      next: funds => { this.supervisedFunds = funds; },
      error: () => {},
    });
  }

  onPurchaseForChange(): void {
    this.selectedFundId = null;
    this.selectedAccountId = null;
    this.fundAccountError = null;
    this.isResolvingFundAccount = false;
    if (this.purchaseFor === 'BANK') {
      this.accounts = [];
      this.loadBankAccount();
    } else {
      this.allOrNone = true;
    }
  }

  onFundChange(): void {
    const fund = this.supervisedFunds.find(f => f.id === this.selectedFundId);
    this.selectedAccountId = null;
    this.fundAccountError = null;

    if (!fund) return;

    const accountId = this.validAccountId(fund.accountId);
    if (accountId) {
      this.selectedAccountId = accountId;
      return;
    }

    this.isResolvingFundAccount = true;
    this.fundService.details(fund.id).subscribe({
      next: detailedFund => {
        Object.assign(fund, detailedFund);
        const detailedAccountId = this.validAccountId(detailedFund.accountId);
        if (detailedAccountId) {
          this.selectedAccountId = detailedAccountId;
          fund.accountId = detailedAccountId;
          this.isResolvingFundAccount = false;
          return;
        }
        this.resolveFundAccountFromNumber(fund);
      },
      error: () => {
        this.resolveFundAccountFromNumber(fund);
      },
    });
  }

  private resolveFundAccountFromNumber(fund: InvestmentFund): void {
    if (!fund.accountNumber) {
      this.fundAccountError = 'Fond nema povezan RSD račun.';
      this.isResolvingFundAccount = false;
      return;
    }

    this.accountService.getEmployeeAccountByNumber(fund.accountNumber).subscribe({
      next: account => {
        const accountId = this.validAccountId(account.id);
        if (!accountId) {
          this.selectedAccountId = null;
          this.fundAccountError = 'Račun fonda je pronađen, ali backend nije vratio accountId.';
          this.isResolvingFundAccount = false;
          return;
        }
        this.selectedAccountId = accountId;
        fund.accountId = accountId;
        this.isResolvingFundAccount = false;
      },
      error: () => {
        this.selectedAccountId = null;
        this.fundAccountError = 'Nije moguće pronaći accountId za račun fonda.';
        this.isResolvingFundAccount = false;
      },
    });
  }

  private validAccountId(value: unknown): number | null {
    const id = Number(value);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  get selectedFund(): InvestmentFund | null {
    return this.supervisedFunds.find(f => f.id === this.selectedFundId) ?? null;
  }

  /**
   * Spec Sc 37: za SELL ucitavamo koliko korisnik ima u portfoliju za ovaj listing
   * i postavljamo to kao [max] na quantity input. Sprecava klijent-side over-sell.
   */
  private loadSellableQuantity(): void {
    this.portfolioService.getPortfolio().subscribe({
      next: summary => {
        const entry = summary.holdings?.find(h => h.listingId === this.listingId);
        this.maxSellQuantity = entry?.quantity ?? 0;
      },
      error: () => {
        this.maxSellQuantity = 0;
      },
    });
  }

  /**
   * Spec Sc 63: margin order zahteva permisiju MARGIN_TRADE; klijent sa odobrenim
   * kreditom dobija ovu permisiju automatski. Aktuari je takodje moraju imati.
   */
  public get canUseMargin(): boolean {
    return this.authService.hasPermission('MARGIN_TRADE');
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
          this.selectedAccountId = this.accounts.length > 0 ? this.accounts[0].id : null;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.toastService.error('Greška pri učitavanju računa.');
        },
      });
      return;
    }

    // Supervisor doing a fund BUY — account is resolved later via onFundChange()
    if (this.isSupervisor && this.direction === 'BUY' && this.purchaseFor === 'INVESTMENT_FUND') {
      this.isLoading = false;
      return;
    }

    this.loadBankAccount();
  }

  private loadBankAccount(): void {
    if (!this.security) return;
    this.accountService.getBankAccountByCurrency(this.security.currency).subscribe({
      next: account => {
        this.accounts = Array.isArray(account) ? account : (account ? [account] : []);
        this.selectedAccountId = this.accounts.length > 0 ? this.accounts[0].id : null;
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
    return this.accounts.find(a => a.id === this.selectedAccountId) ?? null;
  }

  get canSubmit(): boolean {
    if (!this.security || this.quantity <= 0 || !this.selectedAccountId || this.pricePerUnit <= 0) {
      return false;
    }
    if (this.isResolvingFundAccount) {
      return false;
    }
    if (this.margin && !this.canUseMargin) {
      return false;
    }
    if (this.direction === 'SELL' && this.maxSellQuantity > 0 && this.quantity > this.maxSellQuantity) {
      return false;
    }
    if (this.isSupervisor && this.direction === 'BUY' && this.purchaseFor === 'INVESTMENT_FUND' && !this.selectedFundId) {
      return false;
    }
    return true;
  }

  createDraftOrder(): void {
    if (!this.canSubmit || !this.security) return;

    this.isSubmitting = true;

    const isFundBuy = this.isSupervisor && this.direction === 'BUY' && this.purchaseFor === 'INVESTMENT_FUND';
    const payload: any = isFundBuy
      ? {
          listingId: this.listingId,
          quantity: this.quantity,
          accountId: this.selectedAccountId!,
          purchaseFor: 'INVESTMENT_FUND',
          fundId: this.selectedFundId!,
          allOrNone: this.allOrNone,
        }
      : {
          listingId: this.listingId,
          quantity: this.quantity,
          limitValue: this.limitValue || null,
          stopValue: this.stopValue || null,
          allOrNone: this.allOrNone,
          margin: this.margin,
          accountId: this.selectedAccountId!,
        };

    if (this.isSupervisor && this.direction === 'BUY' && !isFundBuy) {
      payload['purchaseFor'] = this.purchaseFor;
    }

    const request$ = this.direction === 'BUY'
      ? this.orderService.createBuyOrder(payload)
      : this.orderService.createSellOrder(payload);

    request$.subscribe({
      next: order => {
        // Add notification
        this.notificationService.addNotification({
          type: NotificationType.ORDER_PENDING,
          title: 'Order poslat na odobrenje',
          message: `Vaš ${this.direction === 'BUY' ? 'kupovni' : 'prodajni'} order za ${order.quantity} $(order.quantity > 1 ? 'hartija' : 'hartije') po ceni od ${this.formatMoney(order.pricePerUnit)} je poslat na odobrenje.`,
          data: { order: order }
        });
        
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
        // Add notification
        this.notificationService.addNotification({
          type: NotificationType.ORDER_COMPLETED,
          title: 'Order potvrđen i obrađen',
          message: `Vaš ${this.direction === 'BUY' ? 'kupovni' : 'prodajni'} order ID ${order.id} je potvrđen i u obradi.`,
          data: { order: order }
        });
        
        this.isSubmitting = false;
        this.showConfirmation = false;
        this.toastService.success('Order je uspešno potvrđen.');
        // Send the user to their portfolio so the new position becomes visible
        // as soon as the order finishes settling. The portfolio page re-fetches
        // on every navigation hit, so this is the simplest way to show that
        // a buy actually landed without forcing a manual refresh.
        const target = this.direction === 'BUY'
          ? (this.purchaseFor === 'INVESTMENT_FUND' && this.selectedFundId ? `/funds/${this.selectedFundId}` : '/portfolio')
          : '/securities';
        this.router.navigate([target]);
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

    const orderId = this.draftOrder.id;

    this.orderService.cancelOrder(this.draftOrder.id).subscribe({
      next: () => {
        // Add notification
        this.notificationService.addNotification({
          type: NotificationType.ORDER_CANCELLED,
          title: 'Order otkazan',
          message: `Vaš order ID ${orderId} je uspešno otkazan.`,
          data: { orderId: orderId }
        });
        
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
