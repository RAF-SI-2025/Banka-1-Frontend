import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'login', component: {} as any },
          { path: 'employees', component: {} as any }
        ])
      ],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ─── getToken ───────────────────────────────────────────────────────────────

  describe('getToken', () => {
    it('should return null if no token in localStorage', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return token if it exists in localStorage', () => {
      localStorage.setItem('authToken', 'test-token');
      expect(service.getToken()).toBe('test-token');
    });
  });

  // ─── isAuthenticated ────────────────────────────────────────────────────────

  describe('isAuthenticated', () => {
    it('should return false if no token', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should return false if token is expired', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) - 3600 };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      localStorage.setItem('authToken', token);
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should return true if token is valid', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) + 3600 };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      localStorage.setItem('authToken', token);
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return false if token is malformed', () => {
      localStorage.setItem('authToken', 'invalid.token');
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  // ─── hasPermission ──────────────────────────────────────────────────────────

  describe('hasPermission', () => {
    it('should return false if no user in localStorage', () => {
      expect(service.hasPermission('EMPLOYEE_MANAGE_ALL')).toBeFalse();
    });

    it('should return true if user has permission', () => {
      localStorage.setItem('loggedUser', JSON.stringify({
        email: 'test@test.com',
        permissions: ['EMPLOYEE_MANAGE_ALL', 'BANKING_BASIC']
      }));
      expect(service.hasPermission('EMPLOYEE_MANAGE_ALL')).toBeTrue();
    });

    it('should return false if user does not have permission', () => {
      localStorage.setItem('loggedUser', JSON.stringify({
        email: 'test@test.com',
        permissions: ['BANKING_BASIC']
      }));
      expect(service.hasPermission('EMPLOYEE_MANAGE_ALL')).toBeFalse();
    });
  });

  // ─── getUserIdFromToken ─────────────────────────────────────────────────────

  describe('getUserIdFromToken', () => {
    it('should return null if no token', () => {
      expect(service.getUserIdFromToken()).toBeNull();
    });

    it('should return user id from token', () => {
      const payload = { id: 42 };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      localStorage.setItem('authToken', token);
      expect(service.getUserIdFromToken()).toBe(42);
    });

    it('should return null if token has no id field', () => {
      const payload = { email: 'test@test.com' };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      localStorage.setItem('authToken', token);
      expect(service.getUserIdFromToken()).toBeNull();
    });
  });

  // ─── logout ─────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should clear all auth data from localStorage', async () => {
      localStorage.setItem('authToken', 'token');
      localStorage.setItem('loggedUser', JSON.stringify({ email: 'test@test.com' }));
      localStorage.setItem('refreshToken', 'refresh');

      service.logout();
      await TestBed.inject(RouterTestingModule as any, null);

      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('loggedUser')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });
});
