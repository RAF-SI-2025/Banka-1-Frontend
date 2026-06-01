import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export type VerificationStatus = 'VERIFIED' | 'EXPIRED' | 'CANCELLED' | 'PENDING';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  constructor(private http: HttpClient) {}

  /**
   * Polls /verification/{sessionId}/status every 2 seconds until a terminal status is reached.
   * Emits each status change including the terminal status (VERIFIED, EXPIRED, CANCELLED).
   * 
   * @param sessionId The verification session ID to poll
   * @returns Observable that emits status updates, final emission includes terminal status
   */
  pollStatus(sessionId: number): Observable<{ sessionId: number; status: VerificationStatus }> {
    return timer(2000, 2000).pipe(
      switchMap(() =>
        this.http.get<{ sessionId: number; status: VerificationStatus }>(
          `${environment.apiUrl}/verification/${sessionId}/status`
        )
      ),
      // takeWhile emits the condition-failing (terminal) status when second parameter is true
      takeWhile((res) => res.status === 'PENDING', true)
    );
  }
}
