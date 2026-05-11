import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavLink {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  navLinks: NavLink[] = [];
  userRole = '';
  userName = '';
  private readonly portfolioLink: NavLink = { label: 'Moj portfolio', route: '/portfolio', icon: 'work' };

  private readonly clientLinks: NavLink[] = [
    { label: 'Početna',    route: '/home',                icon: 'home' },
    { label: 'Računi',     route: '/accounts',            icon: 'account_balance' },
    { label: 'Kartice',    route: '/home/cards', icon: 'credit_card' },
    { label: 'Plaćanja',   route: '/payments',            icon: 'payments' },
    { label: 'Prenos',     route: '/transfers/same',      icon: 'compare_arrows' },
    { label: 'Transfer',   route: '/transfers/different', icon: 'currency_exchange' },
    { label: 'Menjačnica', route: '/exchange',            icon: 'currency_exchange' },
    { label: 'Primaoci plaćanja', route: '/payments/recipients', icon: 'people' },
    { label: 'Hartije',    route: '/securities',          icon: 'trending_up' },
    { label: 'Aktivne ponude', route: '/client/otc-offers', icon: 'handshake' },
    this.portfolioLink,
    { label: 'Krediti',    route: '/loans',               icon: 'credit_card' },
    { label: 'Berza',      route: '/stock-exchange',      icon: 'show_chart' },
  ];

  private readonly employeeLinks: NavLink[] = [
    { label: 'Zaposleni',  route: '/employees',           icon: 'badge' },
    { label: 'Klijenti',   route: '/clients',             icon: 'person' },
    { label: 'Kreiraj račun', route: '/accounts/new',     icon: 'add_card' },
    { label: 'Upravljanje računima', route: '/account-management', icon: 'account_balance' },
    { label: 'Zahtevi za kredite', route: '/loan-request-management', icon: 'request_quote' },
    { label: 'Svi krediti', route: '/loan-management', icon: 'credit_score' },
    { label: 'Hartije',    route: '/securities',          icon: 'trending_up' },
    { label: 'Berza',      route: '/stock-exchange',      icon: 'show_chart' },
    { label: 'Nalozi',     route: '/orders-overview',      icon: 'assignment' },
  ];

  private readonly supervisorLinks: NavLink[] = [
    { label: 'Upravljanje aktuarima', route: '/actuary-management', icon: 'supervisor_account' },
    { label: 'Kreiraj fond', route: '/securities/funds/new', icon: 'add_business' },
    { label: 'Porez', route: '/tax-tracking', icon: 'account_balance' },
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getLoggedUser();
    this.userRole = (user as any)?.role ?? '';
    this.userName = user?.email ?? '';

    if (this.isClient()) {
      this.navLinks = this.clientLinks;
    } else {
      const permissions: string[] = (user as any)?.permissions ?? [];
      this.navLinks = [
        ...this.employeeLinks,
        ...(this.authService.canAccessPortfolio() ? [this.portfolioLink] : []),
        ...(permissions.includes('FUND_AGENT_MANAGE') ? this.supervisorLinks : [])
      ];
    }
  }

  isClient(): boolean {
    return this.authService.isClient();
  }

  logout(): void {
    this.authService.logout();
  }
}
