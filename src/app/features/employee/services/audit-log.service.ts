import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuditLog } from '../models/audit-log';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private apiUrl = `${environment.apiUrl}/audit-logs`;

  constructor(private http: HttpClient) {}

  getAuditLogs(filters?: {
    actionType?: string;
    user?: string;
    fromDate?: string;
    toDate?: string;
  }): Observable<AuditLog[]> {

    let params = new HttpParams();

    if (filters?.actionType) {
      params = params.set('actionType', filters.actionType);
    }

    if (filters?.user) {
      params = params.set('user', filters.user);
    }

    if (filters?.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }

    if (filters?.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    return this.http.get<AuditLog[]>(this.apiUrl, { params });
  }
}