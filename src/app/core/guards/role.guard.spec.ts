import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let router: jasmine.SpyObj<Router>;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => roleGuard(...guardParameters));

  const createRoute = (permission: string): ActivatedRouteSnapshot => {
    const route = new ActivatedRouteSnapshot();
    route.data = { permission };
    return route;
  };

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router }
      ]
    });

    localStorage.clear();
  });

  it('should return true when user has required permission', () => {
    localStorage.setItem('loggedUser', JSON.stringify({
      email: 'admin@test.com',
      permissions: ['ADMIN']
    }));

    const result = executeGuard(createRoute('ADMIN'), {} as any);
    expect(result).toBeTrue();
  });

  it('should return false and redirect to /403 when user lacks permission', () => {
    localStorage.setItem('loggedUser', JSON.stringify({
      email: 'user@test.com',
      permissions: ['USER']
    }));

    const result = executeGuard(createRoute('ADMIN'), {} as any);
    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/403']);
  });

  it('should return false and redirect to /login when no user in localStorage', () => {
    const result = executeGuard(createRoute('ADMIN'), {} as any);
    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
