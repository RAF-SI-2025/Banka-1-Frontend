import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { loggedInGuard } from './logged-in.guard';

describe('loggedInGuard', () => {
  let router: Router;

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'login', component: {} as any },
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

  it('should return true if no token — user can access login', () => {
    const navigateSpy = spyOn(router, 'navigate');

    const result = TestBed.runInInjectionContext(() =>
      loggedInGuard(dummyRoute, dummyState)
    );

    expect(result).toBeTrue();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should return false and redirect to /employees if token exists', () => {
    const navigateSpy = spyOn(router, 'navigate');
    localStorage.setItem('authToken', 'some-token');

    const result = TestBed.runInInjectionContext(() =>
      loggedInGuard(dummyRoute, dummyState)
    );

    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/employees']);
  });
});
