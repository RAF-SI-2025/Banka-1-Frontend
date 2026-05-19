import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { StateComponent } from '../../../../shared/components/state/state.component';
import { AppPaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { AuditLogService } from '../../services/audit-log.service';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_TYPES,
  AuditActionType,
  AuditLogEntry,
  AuditLogFilter,
  AuditLogPage,
} from '../../models/audit-log.model';

/**
 * WP-23 (Celina 3): system Audit Log viewer (`/audit-log`).
 *
 * <p>A server-paginated `z-table` of security-relevant administrative actions
 * — order approvals/declines, actuary-limit changes, employee-permission
 * changes and tax-run triggers — newest first. A filter bar narrows the list
 * by action type, acting user and a date range.
 *
 * <p>Restricted to administrators and supervisors: the lazy `audit-log` route
 * is guarded by `roleGuard` with `anyRole: ['SUPERVISOR', 'ADMIN']` (the same
 * supervisor-only precedent as the `tax-tracking` route). Standalone,
 * lazy-loaded via `loadComponent` so it stays out of the initial bundle.
 */

interface ActionOption {
  value: AuditActionType | '';
  label: string;
}

/** Empty sentinel for the "no filter" select option. */
const ALL = '';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, StateComponent, AppPaginationComponent],
  templateUrl: './audit-log.component.html',
})
export class AuditLogComponent implements OnInit {
  entries: AuditLogEntry[] = [];
  totalElements = 0;
  pageSize = 10;
  /** 0-indexed page number (matches the Spring Data `Page` envelope). */
  currentPage = 0;

  isLoading = true;
  error: string | null = null;

  /* Filter-bar model. `''` / `null` means "no filter" for that field. */
  actionTypeFilter: AuditActionType | '' = ALL;
  actorIdFilter: number | null = null;
  fromDate = '';
  toDate = '';

  /** Action-type select options — "Sve akcije" plus every audited type. */
  readonly actionOptions: ActionOption[] = [
    { value: ALL, label: 'Sve akcije' },
    ...AUDIT_ACTION_TYPES.map((t) => ({
      value: t,
      label: AUDIT_ACTION_LABELS[t],
    })),
  ];

  constructor(private readonly auditLogService: AuditLogService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = null;
    this.auditLogService
      .getAuditLog(this.buildFilter(), this.currentPage, this.pageSize)
      .subscribe({
        next: (page: AuditLogPage) => {
          this.entries = page?.content ?? [];
          this.totalElements = page?.totalElements ?? 0;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.error = 'Greska pri ucitavanju revizionog dnevnika.';
        },
      });
  }

  /** Applies the current filter bar, resetting to the first page. */
  applyFilters(): void {
    this.currentPage = 0;
    this.load();
  }

  /** Clears every filter field and reloads. */
  clearFilters(): void {
    this.actionTypeFilter = ALL;
    this.actorIdFilter = null;
    this.fromDate = '';
    this.toDate = '';
    this.currentPage = 0;
    this.load();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.load();
  }

  /**
   * Builds the {@link AuditLogFilter} from the filter-bar model. Only fields
   * that actually have a value are included — an unset field is left off the
   * object entirely rather than set to `undefined`.
   */
  private buildFilter(): AuditLogFilter {
    const filter: AuditLogFilter = {};
    if (this.actionTypeFilter) {
      filter.actionType = this.actionTypeFilter;
    }
    if (this.actorIdFilter !== null && this.actorIdFilter > 0) {
      filter.actorId = this.actorIdFilter;
    }
    if (this.fromDate) {
      filter.from = this.fromDate;
    }
    if (this.toDate) {
      filter.to = this.toDate;
    }
    return filter;
  }

  /** Readable Serbian label for an audited action type. */
  actionLabel(actionType: AuditActionType): string {
    return AUDIT_ACTION_LABELS[actionType] ?? actionType;
  }

  trackByEntry(_: number, entry: AuditLogEntry): number {
    return entry.id;
  }
}
