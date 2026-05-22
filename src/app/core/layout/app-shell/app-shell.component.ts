import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { OtcNotificationMonitorService } from '../../../features/otc/services/otc-notification-monitor.service';

/** Rute koje renderuju samo router-outlet (bez sidebar/topbar shell-a). */
const AUTH_ROUTE_PATTERN =
  /^\/(login|forgot-password|reset-password|activate|landing)($|[?#/])/;

/**
 * PR_31 Task 5: AppShellComponent
 * Root wrapper koji detektuje auth flow (login/forgot/reset/activate/landing/root)
 * i renderuje samo router-outlet u tom slucaju, ili pun shell (sidebar + topbar +
 * content + command palette) za sve ostale rute.
 */
@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent implements OnInit, OnDestroy {
  /** Auth flow ne prikazuje sidebar/topbar. */
  isAuthRoute = false;
  private sub?: Subscription;

  constructor(
    private router: Router,
    private otcNotificationMonitor: OtcNotificationMonitorService,
  ) {}

  ngOnInit(): void {
    this.isAuthRoute = this.computeIsAuth(this.router.url);
    this.syncOtcMonitor();
    this.sub = this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        map((e) => (e as NavigationEnd).urlAfterRedirects),
      )
      .subscribe((url) => {
        this.isAuthRoute = this.computeIsAuth(url);
        this.syncOtcMonitor();
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.otcNotificationMonitor.stop();
  }

  private syncOtcMonitor(): void {
    if (this.isAuthRoute) {
      this.otcNotificationMonitor.stop();
    } else {
      this.otcNotificationMonitor.start();
    }
  }

  private computeIsAuth(url: string): boolean {
    if (!url || url === '/') return true;
    return AUTH_ROUTE_PATTERN.test(url);
  }
}
