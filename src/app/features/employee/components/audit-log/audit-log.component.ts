import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService, AuditLogDto } from '../../services/audit-log.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
})
export class AuditLogComponent implements OnInit {
  auditLogs: AuditLogDto[] = [];
  isLoading = false;

  filterActionType = '';
  filterActorId = '';
  filterFromDate = '';
  filterToDate = '';

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  readonly actionTypeOptions = [
    { value: '', label: 'Sve akcije' },
    { value: 'CREATE', label: 'Pravljenje' },
    { value: 'UPDATE', label: 'Ažuriranje' },
    { value: 'DELETE', label: 'Brisanje' },
    { value: 'APPROVE', label: 'Odobravanje' },
    { value: 'REJECT', label: 'Odbijanje' },
    { value: 'EXECUTE', label: 'Izvršavanje' },
  ];

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.isLoading = true;

    this.auditLogService.getAuditLogs({
      actionType: this.filterActionType,
      actorId: this.filterActorId,
      fromDate: this.filterFromDate,
      toDate: this.filterToDate,
      page: this.currentPage,
      size: this.pageSize,
    }).subscribe({
      next: (data) => {
        this.auditLogs = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Greška pri učitavanju audit logova:', err);
        this.auditLogs = [];
        this.isLoading = false;
        this.toastService.error('Greška pri učitavanju audit logova.');
      }
    });
  }

  onFiltersChange(): void {
    this.currentPage = 0; // Reset to first page
    this.loadAuditLogs();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadAuditLogs();
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

  clearFilters(): void {
    this.filterActionType = '';
    this.filterActorId = '';
    this.filterFromDate = '';
    this.filterToDate = '';
    this.currentPage = 0;
    this.loadAuditLogs();
  }

  formatTimestamp(timestamp: string): string {
    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(timestamp));
  }

  trackById(index: number, log: AuditLogDto): number {
    return log.id;
  }
}