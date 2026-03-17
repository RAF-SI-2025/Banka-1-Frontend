import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
describe('AppRoutingModule', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppRoutingModule]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should have guarded route for employees/accounts/new with CLIENT_MANAGE permission', () => {
    const route = router.config.find((r) => r.path === 'employees/accounts/new');
    if (!route) {
      throw new Error('Route employees/accounts/new should exist');
    }

    if (!route.canActivate) {
      throw new Error('Route should have canActivate guards');
    }

    // Guards are functions in this project; ensure both are present
    if (!route.canActivate.includes(authGuard)) {
      throw new Error('authGuard should be present on the route');
    }

    if (!route.canActivate.includes(roleGuard)) {
      throw new Error('roleGuard should be present on the route');
    }

    if (route.data?.['permission'] !== 'CLIENT_MANAGE') {
      throw new Error('Route should have data.permission === CLIENT_MANAGE');
    }
  });
});
