import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Actuary } from '../models/actuary';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActuaryService {
  private apiUrl = `${environment.apiUrl}/order/actuaries`;

  constructor(private http: HttpClient) {}

  getAgents(
    page: number = 0,
    size: number = 10,
    filters?: { email?: string; ime?: string; prezime?: string; pozicija?: string }
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters?.email) params = params.set('email', filters.email);
    if (filters?.ime) params = params.set('ime', filters.ime);
    if (filters?.prezime) params = params.set('prezime', filters.prezime);
    if (filters?.pozicija) params = params.set('pozicija', filters.pozicija);

    return this.http.get<any>(`${this.apiUrl}/agents`, { params });
  }

  updateAgentLimit(agentId: number, newLimit: number): Observable<Actuary> {
    return this.http.put<Actuary>(`${this.apiUrl}/agents/${agentId}/limit`, { limit: newLimit });
  }

  resetAgentUsedLimit(agentId: number): Observable<Actuary> {
    return this.http.put<Actuary>(`${this.apiUrl}/agents/${agentId}/reset-limit`, {});
  }

  updateNeedApproval(agentId: number, needApproval: boolean): Observable<Actuary> {
  return this.http.put<Actuary>(`${this.apiUrl}/agents/${agentId}/need-approval`, { needApproval });
}
}
