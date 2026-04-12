import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {

  private apiUrl = `${environment.apiUrl}/stock/api`;

  constructor(private http: HttpClient) {}

  getExchanges(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl + '/stock-exchanges');
  }
}
