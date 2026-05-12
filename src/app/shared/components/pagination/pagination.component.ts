import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * PR_31 T10: AppPaginationComponent
 *
 * Reusable pagination control sa numerickom listom strana + ellipsis-om.
 * Page indexing je 1-based (page=1 znaci prva strana).
 *
 * Standalone — importovati direktno u NgModule.imports ili u standalone
 * Component.imports niz.
 *
 * Usage:
 *   <app-pagination
 *     [total]="totalItems"
 *     [pageSize]="pageSize"
 *     [page]="currentPage"
 *     (pageChange)="onPageChange($event)">
 *   </app-pagination>
 *
 * Za call-site-ove koji koriste 0-indexed convention (`currentPage = 0..N-1`,
 * `totalElements`, `goToPage(0..N-1)`) — pass `[page]="currentPage + 1"` i
 * koristi `(pageChange)="goToPage($event - 1)"`.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
})
export class AppPaginationComponent {
  @Input() total = 0;
  @Input() pageSize = 10;
  @Input() page = 1;
  @Input() siblingCount = 1;
  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get pages(): (number | '...')[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    const start = Math.max(2, this.page - this.siblingCount);
    const end = Math.min(total - 1, this.page + this.siblingCount);
    pages.push(1);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push('...');
    pages.push(total);
    return pages;
  }

  goto(p: number | '...'): void {
    if (p === '...' || p < 1 || p > this.totalPages || p === this.page) return;
    this.pageChange.emit(p as number);
  }

  next(): void {
    if (this.page < this.totalPages) this.pageChange.emit(this.page + 1);
  }

  prev(): void {
    if (this.page > 1) this.pageChange.emit(this.page - 1);
  }
}
