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
    { label: 'Krediti',    route: '/loans',               icon: 'credit_card' },
  ];

  private readonly employeeLinks: NavLink[] = [
    { label: 'Zaposleni',  route: '/employees',           icon: 'badge' },
    { label: 'Klijenti',   route: '/clients',             icon: 'person' },
    { label: 'Kreiraj račun', route: '/accounts/new',     icon: 'add_card' },
    { label: 'Upravljanje računima', route: '/account-management', icon: 'account_balance' },
    { label: 'Zahtevi za kredite', route: '/loan-request-management', icon: 'request_quote' },
    { label: 'Svi krediti', route: '/loan-management', icon: 'credit_score' },
    { label: 'Hartije',    route: '/securities',          icon: 'trending_up' },
  ];

  private readonly supervisorLinks: NavLink[] = [
    { label: 'Upravljanje aktuarima', route: '/actuary-management', icon: 'supervisor_account' },
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
        ...(permissions.includes('FUND_AGENT_MANAGE') ? this.supervisorLinks : [])
      ];
    }
  }

  isClient(): boolean {
    return this.userRole.toUpperCase().startsWith('CLIENT');
  }

  logout(): void {
    this.authService.logout();
  }
}
