import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VerificationService, VerificationStatus } from './verification.service';
import { environment } from 'src/environments/environment';

describe('VerificationService', () => {
  let service: VerificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VerificationService]
    });
    service = TestBed.inject(VerificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should poll /verification/{sessionId}/status every 2 seconds', (done) => {
    const sessionId = 123;
    const statusUrl = `${environment.apiUrl}/verification/${sessionId}/status`;
    
    const subscription = service.pollStatus(sessionId).subscribe({
      next: (res) => {
        expect(res.sessionId).toBe(sessionId);
      },
      complete: () => {
        done();
      }
    });

    // First poll at ~2000ms
    setTimeout(() => {
      httpMock.expectOne(statusUrl).flush({ sessionId, status: 'PENDING' as VerificationStatus });
    }, 2000);

    // Second poll at ~4000ms
    setTimeout(() => {
      httpMock.expectOne(statusUrl).flush({ sessionId, status: 'VERIFIED' as VerificationStatus });
      subscription.unsubscribe();
    }, 4000);
  });

  it('should emit terminal status (VERIFIED) and complete', (done) => {
    const sessionId = 456;
    const statusUrl = `${environment.apiUrl}/verification/${sessionId}/status`;
    let emissionCount = 0;

    const subscription = service.pollStatus(sessionId).subscribe({
      next: (res) => {
        emissionCount++;
        if (res.status === 'VERIFIED') {
          expect(emissionCount).toBe(1); // Should complete after first VERIFIED
          done();
        }
      }
    });

    setTimeout(() => {
      httpMock.expectOne(statusUrl).flush({ sessionId, status: 'VERIFIED' as VerificationStatus });
    }, 2000);
  });

  it('should handle EXPIRED status', (done) => {
    const sessionId = 789;
    const statusUrl = `${environment.apiUrl}/verification/${sessionId}/status`;

    const subscription = service.pollStatus(sessionId).subscribe({
      next: (res) => {
        expect(res.status).toBe('EXPIRED');
        done();
      }
    });

    setTimeout(() => {
      httpMock.expectOne(statusUrl).flush({ sessionId, status: 'EXPIRED' as VerificationStatus });
    }, 2000);
  });
});
