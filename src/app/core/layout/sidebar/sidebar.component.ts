import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { filterNavByPermissions, NAV_MANIFEST, NavGroup } from '../nav-manifest';

/**
 * PR_31 Task 6: SidebarComponent
 *
 * Renderuje levu navigaciju kao group-headed listu linkova. Source-of-truth je
 * `NAV_MANIFEST` (Task 4), filtriran kroz `filterNavByPermissions` na osnovu
 * `AuthService.getLoggedUser().permissions`. Aktivni link dobija zlatni rail
 * preko `.z-sidebar-item-active` (styles.scss linije 684-693).
 */
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  groups: NavGroup[] = [];
  currentUrl = '';
  private sub?: Subscription;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const user = this.auth.getLoggedUser();
    const perms = user?.permissions ?? [];
    /* Klijent trading flow ima role='CLIENT_TRADING' ali prazan permissions[];
       ubacujemo role u capability set kako bi NavManifest mogao da gada CLIENT_TRADING. */
    const role = (user as any)?.role as string | undefined;
    const capabilities = role ? [...perms, role] : perms;
    this.groups = filterNavByPermissions(NAV_MANIFEST, capabilities);
    this.currentUrl = this.router.url;
    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl = (e as NavigationEnd).urlAfterRedirects;
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /**
   * `route` je smatran aktivnim ako je trenutni URL identican ili ako URL
   * pocinje sa `route + '/'`. Time `/accounts/payment/new` aktivira i
   * `/accounts` link i `/accounts/payment/new` link istovremeno — gold rail
   * pokazuje gde si u stablu navigacije.
   */
  isActive(route: string): boolean {
    if (!route) return false;
    return this.currentUrl === route || this.currentUrl.startsWith(route + '/');
  }
}
