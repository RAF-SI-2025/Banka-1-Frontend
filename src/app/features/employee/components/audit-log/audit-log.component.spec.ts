import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuditLogComponent } from './audit-log.component';
import { AuditLogService } from '../../services/audit-log.service';
import { AuditLogEntry, AuditLogPage } from '../../models/audit-log.model';

function entry(id: number, overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id,
    actorId: 10 + id,
    actorName: `Actor ${id}`,
    actionType: 'ORDER_APPROVED',
    targetType: 'ORDER',
    targetId: 1000 + id,
    details: `Detail ${id}`,
    createdAt: '2026-05-01T10:00:00Z',
    ...overrides,
  };
}

function page(content: AuditLogEntry[], totalElements = content.length): AuditLogPage {
  return {
    content,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / 10)),
    number: 0,
    size: 10,
  };
}

describe('AuditLogComponent', () => {
  let fixture: ComponentFixture<AuditLogComponent>;
  let component: AuditLogComponent;
  let service: jasmine.SpyObj<AuditLogService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('AuditLogService', ['getAuditLog']);
    service.getAuditLog.and.returnValue(of(page([])));

    await TestBed.configureTestingModule({
      imports: [AuditLogComponent],
      providers: [{ provide: AuditLogService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads the first page on init', () => {
    service.getAuditLog.and.returnValue(of(page([entry(1), entry(2)], 2)));
    fixture.detectChanges();

    expect(service.getAuditLog).toHaveBeenCalledWith({}, 0, 10);
    expect(component.entries.length).toBe(2);
    expect(component.totalElements).toBe(2);
    expect(component.isLoading).toBeFalse();
  });

  it('sets an error message when the log fails to load', () => {
    service.getAuditLog.and.returnValue(throwError(() => new Error('network')));
    fixture.detectChanges();

    expect(component.error).toBe('Greska pri ucitavanju revizionog dnevnika.');
    expect(component.isLoading).toBeFalse();
  });

  it('exposes "Sve akcije" plus every audited action type as filter options', () => {
    /* 8 audited types + the "all" sentinel = 9 select options. */
    expect(component.actionOptions.length).toBe(9);
    expect(component.actionOptions[0].value).toBe('');
  });

  it('applyFilters resets to page 0 and forwards every set filter field', () => {
    fixture.detectChanges();
    component.currentPage = 3;
    component.actionTypeFilter = 'AGENT_LIMIT_CHANGED';
    component.actorIdFilter = 42;
    component.fromDate = '2026-01-01';
    component.toDate = '2026-05-19';

    component.applyFilters();

    expect(component.currentPage).toBe(0);
    expect(service.getAuditLog).toHaveBeenCalledWith(
      {
        actionType: 'AGENT_LIMIT_CHANGED',
        actorId: 42,
        from: '2026-01-01',
        to: '2026-05-19',
      },
      0,
      10,
    );
  });

  it('applyFilters omits a non-positive actor id', () => {
    fixture.detectChanges();
    component.actorIdFilter = 0;
    component.applyFilters();
    expect(service.getAuditLog).toHaveBeenCalledWith({}, 0, 10);
  });

  it('clearFilters wipes every field and reloads with an empty filter', () => {
    fixture.detectChanges();
    component.actionTypeFilter = 'ORDER_DECLINED';
    component.actorIdFilter = 9;
    component.fromDate = '2026-01-01';
    component.toDate = '2026-05-19';
    service.getAuditLog.calls.reset();

    component.clearFilters();

    expect(component.actionTypeFilter).toBe('');
    expect(component.actorIdFilter).toBeNull();
    expect(component.fromDate).toBe('');
    expect(component.toDate).toBe('');
    expect(service.getAuditLog).toHaveBeenCalledWith({}, 0, 10);
  });

  it('onPageChange reloads with the new 0-indexed page', () => {
    service.getAuditLog.and.returnValue(of(page([], 80)));
    fixture.detectChanges();

    component.onPageChange(4);
    expect(component.currentPage).toBe(4);
    expect(service.getAuditLog).toHaveBeenCalledWith({}, 4, 10);
  });

  it('actionLabel maps each enum value to a Serbian label', () => {
    expect(component.actionLabel('ORDER_APPROVED')).toBe('Order odobren');
    expect(component.actionLabel('TAX_RUN_MANUAL')).toBe('Rucno pokretanje poreza');
    expect(component.actionLabel('EMPLOYEE_PERMISSIONS_CHANGED')).toBe(
      'Promena permisija zaposlenog',
    );
  });
});
