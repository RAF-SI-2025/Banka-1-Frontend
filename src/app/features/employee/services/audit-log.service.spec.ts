import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { environment } from '../../../../environments/environment';
import { AuditLogService } from './audit-log.service';
import { AuditLogEntry, AuditLogPage } from '../models/audit-log.model';

const baseUrl = `${environment.apiUrl}/audit`;

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

describe('AuditLogService', () => {
  let service: AuditLogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuditLogService],
    });
    service = TestBed.inject(AuditLogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAuditLog GETs /audit with only page + size when no filter is given', () => {
    let result: AuditLogPage | undefined;
    service.getAuditLog({}, 0, 10).subscribe((p) => (result = p));

    const req = httpMock.expectOne(
      (r) => r.url === baseUrl && r.params.keys().length === 2,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    const body = page([entry(1), entry(2)], 2);
    req.flush(body);
    expect(result).toEqual(body);
  });

  it('getAuditLog forwards every filter field as a query param', () => {
    service
      .getAuditLog(
        {
          actionType: 'AGENT_LIMIT_CHANGED',
          actorId: 42,
          from: '2026-01-01',
          to: '2026-05-19',
        },
        2,
        25,
      )
      .subscribe();

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('25');
    expect(req.request.params.get('actionType')).toBe('AGENT_LIMIT_CHANGED');
    expect(req.request.params.get('actorId')).toBe('42');
    expect(req.request.params.get('from')).toBe('2026-01-01');
    expect(req.request.params.get('to')).toBe('2026-05-19');
    req.flush(page([]));
  });

  it('getAuditLog omits filter params that are unset', () => {
    service.getAuditLog({ actorId: 7 }, 0, 10).subscribe();

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.params.get('actorId')).toBe('7');
    expect(req.request.params.has('actionType')).toBeFalse();
    expect(req.request.params.has('from')).toBeFalse();
    expect(req.request.params.has('to')).toBeFalse();
    req.flush(page([]));
  });
});
