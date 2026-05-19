import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuditLogFilter, AuditLogPage } from '../models/audit-log.model';

/**
 * WP-23 (Celina 3): Audit Log client.
 *
 * <p>Wraps the JWT-secured audit endpoint exposed through the gateway at
 * `GET /audit`. The {@link AuthInterceptor} attaches the `Authorization`
 * header automatically. The endpoint is restricted to administrators and
 * supervisors; the `audit-log` route is additionally guarded by `roleGuard`
 * with `anyRole: ['SUPERVISOR', 'ADMIN']`.
 */
@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly baseUrl = `${environment.apiUrl}/audit`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Fetches one page of audit-log entries, newest first.
   *
   * @param filter optional action-type / actor-id / date-range filter; empty
   *   or `undefined` fields are not sent as query params.
   * @param page 0-indexed page number (matches the Spring Data `Page`).
   * @param size page size.
   */
  getAuditLog(
    filter: AuditLogFilter = {},
    page = 0,
    size = 10,
  ): Observable<AuditLogPage> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (filter.actionType) {
      params = params.set('actionType', filter.actionType);
    }
    if (filter.actorId !== undefined && filter.actorId !== null) {
      params = params.set('actorId', String(filter.actorId));
    }
    if (filter.from) {
      params = params.set('from', filter.from);
    }
    if (filter.to) {
      params = params.set('to', filter.to);
    }

    return this.http.get<AuditLogPage>(this.baseUrl, { params });
  }
}
