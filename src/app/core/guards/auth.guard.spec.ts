import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let router: jasmine.SpyObj<Router>;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router }
      ]
    });

    localStorage.clear();
  });

  it('should return true when token exists', () => {
    localStorage.setItem('authToken', 'fake-token');
    const result = executeGuard({} as any, {} as any);
    expect(result).toBeTrue();
  });

  it('should return false and redirect to /login when no token', () => {
    const result = executeGuard({} as any, {} as any);
    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
