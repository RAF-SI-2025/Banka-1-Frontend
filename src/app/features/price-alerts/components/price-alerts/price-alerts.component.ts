import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../shared/services/toast.service';
import { SecuritiesService } from '../../../securities/services/securities.service';
import { PriceAlertService, PriceAlertDto } from '../../services/price-alert.service';
import { PriceAlertCondition, PriceAlertNotificationType } from '../../models/price-alert.model';

@Component({
  selector: 'app-price-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './price-alerts.component.html',
  styleUrls: ['./price-alerts.component.scss'],
})
export class PriceAlertsPageComponent implements OnInit {
  alerts: PriceAlertDto[] = [];
  isLoading = false;
  isCreating = false;
  showCreateForm = false;

  // Create form
  selectedListingId: number | null = null;
  selectedCondition: PriceAlertCondition = 'ABOVE';
  selectedThreshold: number | null = null;
  selectedNotificationType: PriceAlertNotificationType = 'IN_APP';

  // Securities for dropdown
  securities: any[] = [];
  securitiesLoading = false;

  readonly conditions: { value: PriceAlertCondition; label: string }[] = [
    { value: 'ABOVE', label: 'Iznad cene' },
    { value: 'BELOW', label: 'Ispod cene' },
    { value: 'DAILY_DROP_PERCENT', label: 'Pad (%) u toku dana' },
  ];

  readonly notificationTypes: { value: PriceAlertNotificationType; label: string }[] = [
    { value: 'IN_APP', label: 'U aplikaciji' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'SMS', label: 'SMS' },
  ];

  constructor(
    private readonly priceAlertService: PriceAlertService,
    private readonly securitiesService: SecuritiesService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
    this.loadSecurities();
  }

  loadAlerts(): void {
    this.isLoading = true;
    this.priceAlertService.getPriceAlerts().subscribe({
      next: (alerts) => {
        this.alerts = alerts;
        this.isLoading = false;
      },
      error: () => {
        this.toastService.error('Greška pri učitavanju alarma.');
        this.isLoading = false;
      },
    });
  }

  loadSecurities(): void {
    this.securitiesLoading = true;
    // Fetch securities from the backend for the dropdown
    this.securitiesService.getSecurities().subscribe({
      next: (response: any) => {
        this.securities = response.content || response || [];
        this.securitiesLoading = false;
      },
      error: () => {
        this.securitiesLoading = false;
      },
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  createAlert(): void {
    if (!this.selectedListingId || this.selectedThreshold === null) {
      this.toastService.error('Popunite sva polja.');
      return;
    }

    this.isCreating = true;

    this.priceAlertService.createPriceAlert({
      listingId: this.selectedListingId,
      condition: this.selectedCondition,
      threshold: this.selectedThreshold,
      notificationType: this.selectedNotificationType,
    }).subscribe({
      next: () => {
        this.toastService.success('Alarm je uspešno kreiran.');
        this.resetForm();
        this.showCreateForm = false;
        this.loadAlerts();
        this.isCreating = false;
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Greška pri kreiranju alarma.');
        this.isCreating = false;
      },
    });
  }

  toggleAlert(alertId: number, currentActive: boolean): void {
    this.priceAlertService.togglePriceAlert(alertId, !currentActive).subscribe({
      next: () => {
        this.loadAlerts();
      },
      error: () => {
        this.toastService.error('Greška pri ažuriranju alarma.');
      },
    });
  }

  deleteAlert(alertId: number): void {
    if (!confirm('Da li ste sigurni da želite da obbrišete ovaj alarm?')) {
      return;
    }

    this.priceAlertService.deletePriceAlert(alertId).subscribe({
      next: () => {
        this.toastService.success('Alarm je obrisan.');
        this.loadAlerts();
      },
      error: () => {
        this.toastService.error('Greška pri brisanju alarma.');
      },
    });
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatDate(value: string | undefined): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('sr-RS');
  }

  getConditionLabel(condition: PriceAlertCondition): string {
    return this.conditions.find(c => c.value === condition)?.label || condition;
  }

  getSecurityName(listingId: number): string {
    const security = this.securities.find(s => s.id === listingId || s.listingId === listingId);
    return security ? `${security.ticker} - ${security.name}` : `ID: ${listingId}`;
  }

  private resetForm(): void {
    this.selectedListingId = null;
    this.selectedCondition = 'ABOVE';
    this.selectedThreshold = null;
    this.selectedNotificationType = 'IN_APP';
  }

  trackById(index: number, alert: PriceAlertDto): number {
    return alert.id;
  }
}
