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

updateNeedApproval(id: number, needApproval: boolean): Observable<void> {
  // Koristimo apiUrl (koji je već .../order/actuaries) i samo dodajemo /agents/...
  return this.http.put<void>(`${this.apiUrl}/agents/${id}/need-approval`, { needApproval });
}

  /**
   * PR_14 C14.9: trading P&L po aktuaru (suma komisija sa izvrsenih transakcija).
   * Zameni stari fund-AUM aggregation pristup u ProfitAktuaraComponent-u.
   */
  profitByActuary(from?: string, to?: string): Observable<ActuaryProfit[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<ActuaryProfit[]>(`${this.apiUrl}/profit`, { params });
  }

  /**
   * PR_17 C17.6: bank-wide trading P&L summary. Trading-side doprinos;
   * fund-side se sabira posebno iz /funds endpoint-a.
   */
  bankProfitSummary(from?: string, to?: string): Observable<BankProfitSummary> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<BankProfitSummary>(`${this.apiUrl}/profit/bank-summary`, { params });
  }
}

export interface ActuaryProfit {
  userId: number;
  totalCommission: number;
  transactionCount: number;
  // PR_15 C15.7: optional enrichment fields iz employee-service-a.
  ime?: string;
  prezime?: string;
  pozicija?: string;
}

export interface BankProfitSummary {
  totalCommission: number;
  transactionCount: number;
  distinctActuaries: number;
  from: string | null;
  to: string | null;
}
