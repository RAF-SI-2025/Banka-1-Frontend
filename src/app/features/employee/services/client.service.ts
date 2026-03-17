import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ClientDto {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string; // for companies
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private base = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) {}

  // Simple fetch all clients endpoint. If backend supports pagination/search, prefer that.
  getAllClients(): Observable<ClientDto[]> {
    // In development provide a small set of mock clients so the UI is usable
    // without a running backend. This is skipped in production builds.
    if (!environment.production) {
      const mock: ClientDto[] = [
        { id: 'c1', firstName: 'Marko', lastName: 'Markovic', email: 'marko@example.com' },
        { id: 'c2', firstName: 'Ana', lastName: 'Petrovic', email: 'ana@example.com' },
        { id: 'c3', name: 'Acme d.o.o.', email: 'office@acme.example' }
      ];
      return of(mock);
    }

    return this.http.get<ClientDto[]>(this.base);
  }

  // Optional search endpoint (not used by default implementation)
  searchClients(query: string, page = 0, size = 50): Observable<{ content: ClientDto[]; total?: number }> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (query) params = params.set('q', query);
    return this.http.get<{ content: ClientDto[]; total?: number }>(`${this.base}/search`, { params });
  }
}
