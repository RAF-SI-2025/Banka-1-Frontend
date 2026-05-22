import { Component, OnInit } from '@angular/core';
import { AuditLog } from '../../models/audit-log';
import { AuditLogService } from '../../services/audit-log.service';

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss']
})
export class AuditLogComponent implements OnInit {

  auditLogs: AuditLog[] = [];
  isLoading = false;

  filterActionType = '';
  filterUser = '';
  filterFromDate = '';
  filterToDate = '';

  constructor(
    private auditLogService: AuditLogService
  ) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.isLoading = true;

    this.auditLogService.getAuditLogs({
      actionType: this.filterActionType,
      user: this.filterUser,
      fromDate: this.filterFromDate,
      toDate: this.filterToDate
    }).subscribe({
      next: (data) => {
        this.auditLogs = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Greška pri učitavanju audit logova:', err);
        this.auditLogs = [];
        this.isLoading = false;
      }
    });
  }

  onFiltersChange(): void {
    this.loadAuditLogs();
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('sr-RS');
  }
}