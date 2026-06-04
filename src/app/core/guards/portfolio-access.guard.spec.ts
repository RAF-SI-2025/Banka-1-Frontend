import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { portfolioAccessGuard } from './portfolio-access.guard';
import { AuthService } from '../services/auth.service';

describe('portfolioAccessGuard', () => {
  let router: Router;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const routeStub = {} as ActivatedRouteSnapshot;
  const stateStub = { url: '/portfolio' } as RouterStateSnapshot;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['canAccessPortfolio']);

    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: '403', component: {} as any },
        ]),
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should allow access when user can access portfolio', () => {
    authServiceSpy.canAccessPortfolio.and.returnValue(true);
    const navigateSpy = spyOn(router, 'navigate');

    const result = TestBed.runInInjectionContext(() =>
      portfolioAccessGuard(routeStub, stateStub),
    );

    expect(result).toBeTrue();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should redirect to /403 when user cannot access portfolio', () => {
    authServiceSpy.canAccessPortfolio.and.returnValue(false);
    const navigateSpy = spyOn(router, 'navigate');

    const result = TestBed.runInInjectionContext(() =>
      portfolioAccessGuard(routeStub, stateStub),
    );

    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/403']);
  });
});
