import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let router: Router;

  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'login', component: {} as any },
          { path: '403', component: {} as any },
          { path: 'employees', component: {} as any }
        ])
      ]
    });
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const buildRoute = (permission: string): ActivatedRouteSnapshot => {
    const route = {} as ActivatedRouteSnapshot;
    (route as any).data = { permission };
    return route;
  };

  it('should redirect to /login if no user in localStorage', () => {
    const navigateSpy = spyOn(router, 'navigate');

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(buildRoute('EMPLOYEE_MANAGE_ALL'), dummyState)
    );

    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should return true if route has no required permission', () => {
    localStorage.setItem('loggedUser', JSON.stringify({
      email: 'test@test.com',
      role: 'EmployeeAdmin',
      permissions: []
    }));

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(buildRoute(''), dummyState)
    );

    expect(result).toBeTrue();
  });

  it('should return true if user has required permission', () => {
    localStorage.setItem('loggedUser', JSON.stringify({
      email: 'test@test.com',
      role: 'EmployeeAdmin',
      permissions: ['EMPLOYEE_MANAGE_ALL']
    }));

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(buildRoute('EMPLOYEE_MANAGE_ALL'), dummyState)
    );

    expect(result).toBeTrue();
  });

  it('should redirect to /403 if user does not have required permission', () => {
    const navigateSpy = spyOn(router, 'navigate');
    localStorage.setItem('loggedUser', JSON.stringify({
      email: 'test@test.com',
      role: 'EmployeeBasic',
      permissions: ['BANKING_BASIC']
    }));

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(buildRoute('EMPLOYEE_MANAGE_ALL'), dummyState)
    );

    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/403']);
  });

  // PR_28 C28.x je uklonio ROLE_PERMISSIONS frontend fallback (duplicirao backend, magic mapping).
  // Sada kada permissions iz localStorage-a nedostaje, guard mora da odbije pristup
  // (sigurnost: nikad ne pretpostavljati permisije bez backend potvrde).
  it('should redirect to /403 if permissions array is missing (no frontend fallback after PR_28)', () => {
    const navigateSpy = spyOn(router, 'navigate');
    localStorage.setItem('loggedUser', JSON.stringify({
      email: 'test@test.com',
      role: 'EmployeeAdmin',
      permissions: null
    }));

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(buildRoute('EMPLOYEE_MANAGE_ALL'), dummyState)
    );

    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/403']);
  });

  it('should redirect to /403 if allowedRoles is set and user role does not match', () => {
    const navigateSpy = spyOn(router, 'navigate');
    localStorage.setItem('loggedUser', JSON.stringify({
      email: 'admin@test.com',
      role: 'Admin',
      permissions: ['FUND_AGENT_MANAGE'],
    }));

    const route = {} as ActivatedRouteSnapshot;
    (route as any).data = {
      permission: 'FUND_AGENT_MANAGE',
      allowedRoles: ['Supervisor'],
    };

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(route, dummyState)
    );

    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/403']);
  });

  it('should allow when allowedRoles includes user role', () => {
    localStorage.setItem('loggedUser', JSON.stringify({
      email: 'sup@test.com',
      role: 'Supervisor',
      permissions: ['FUND_AGENT_MANAGE'],
    }));

    const route = {} as ActivatedRouteSnapshot;
    (route as any).data = {
      permission: 'FUND_AGENT_MANAGE',
      allowedRoles: ['Supervisor'],
    };

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(route, dummyState)
    );

    expect(result).toBeTrue();
  });
});
