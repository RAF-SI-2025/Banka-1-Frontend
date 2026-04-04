import { Component, OnInit } from '@angular/core';
import { Actuary } from '../../models/actuary';
import { ActuaryService } from '../../services/actuary.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-actuary-management',
  templateUrl: './actuary-management.component.html',
  styleUrls: ['./actuary-management.component.css']
})
export class ActuaryManagementComponent implements OnInit {
  agents: Actuary[] = [];
  isLoading = false;

  filterEmail = '';
  filterName = '';
  filterPosition = '';

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  editingAgentId: number | null = null;
  editLimitValue: number | null = null;

  confirmResetAgentId: number | null = null;

  private searchTimeout: any;

  constructor(
    private actuaryService: ActuaryService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.isLoading = true;

    const nameParts = this.filterName.trim().split(/\s+/);
    const filters = {
      email: this.filterEmail.trim() || undefined,
      ime: nameParts[0] || undefined,
      prezime: nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined,
      pozicija: this.filterPosition.trim() || undefined
    };

    this.actuaryService.getAgents(this.currentPage, this.pageSize, filters).subscribe({
      next: (data: any) => {
        this.agents = data.content || [];
        this.totalElements = data.totalElements || 0;
        this.totalPages = data.totalPages || 0;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.error?.message || 'Greška pri učitavanju agenata.');
      }
    });
  }

  onFilterChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 0;
      this.loadAgents();
    }, 350);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadAgents();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadAgents();
  }

  getLastItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  startEditLimit(agent: Actuary): void {
    this.editingAgentId = agent.id;
    this.editLimitValue = agent.limit;
  }

  cancelEditLimit(): void {
    this.editingAgentId = null;
    this.editLimitValue = null;
  }

  saveLimit(agent: Actuary): void {
    if (this.editLimitValue === null || this.editLimitValue < 0) {
      this.toastService.error('Unesite validan iznos limita.');
      return;
    }

    this.actuaryService.updateAgentLimit(agent.id, this.editLimitValue).subscribe({
      next: () => {
        agent.limit = this.editLimitValue!;
        this.toastService.success('Limit uspešno izmenjen.');
        this.cancelEditLimit();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Greška pri izmeni limita.');
      }
    });
  }

  promptResetLimit(agent: Actuary): void {
    this.confirmResetAgentId = agent.id;
  }

  cancelResetLimit(): void {
    this.confirmResetAgentId = null;
  }

  confirmResetLimitAction(agent: Actuary): void {
    this.actuaryService.resetAgentUsedLimit(agent.id).subscribe({
      next: () => {
        agent.usedLimit = 0;
        this.toastService.success('Iskorišćeni limit uspešno resetovan.');
        this.confirmResetAgentId = null;
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Greška pri resetovanju limita.');
        this.confirmResetAgentId = null;
      }
    });
  }

  getAgentForReset(): Actuary | undefined {
    return this.agents.find(a => a.id === this.confirmResetAgentId);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  trackById(index: number, agent: Actuary): number {
    return agent.id;
  }
}
