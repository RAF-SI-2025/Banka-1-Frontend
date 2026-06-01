import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AuditLogDto {
  id: number;
  actorName: string;
  actionType: string;
  performedBy: string;
  target: string;
  newValue: string;
  timestamp: string;
}

export interface AuditLogPageResponse {
  content: AuditLogDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private readonly apiUrl = `${environment.apiUrl}/audit`;

  constructor(private http: HttpClient) {}

  getAuditLogs(filters?: {
    actionType?: string;
    actorId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
  }): Observable<AuditLogPageResponse> {

    let params = new HttpParams();

    if (filters?.actionType) {
      params = params.set('actionType', filters.actionType);
    }

    if (filters?.actorId) {
      params = params.set('actorId', filters.actorId);
    }

    if (filters?.fromDate) {
      params = params.set('from', filters.fromDate);
    }

    if (filters?.toDate) {
      params = params.set('to', filters.toDate);
    }

    if (filters?.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }

    if (filters?.size !== undefined) {
      params = params.set('size', filters.size.toString());
    }

    return this.http.get<AuditLogPageResponse>(this.apiUrl, { params });
  }
}