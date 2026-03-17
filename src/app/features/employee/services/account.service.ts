import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private base = `${environment.apiUrl}/accounts`;

  constructor(private http: HttpClient) {}

  createAccount(payload: any): Observable<any> {
    return this.http.post(this.base, payload);
  }
}
