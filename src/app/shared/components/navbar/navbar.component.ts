import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  navLinks = [
    { label: 'Računi',     route: '/accounts',            icon: 'account_balance' },
    { label: 'Klijenti',   route: '/clients',             icon: 'person' },
    { label: 'Plaćanja',   route: '/payments',            icon: 'payments' },
    { label: 'Prenos',     route: '/transfers/same',      icon: 'compare_arrows' },
    { label: 'Transfer',   route: '/transfers/different', icon: 'currency_exchange' },
    { label: 'Menjačnica', route: '/exchange',            icon: 'currency_exchange' },
    { label: 'Kartice',    route: '/cards',               icon: 'credit_card' },
    { label: 'Krediti',    route: '/loans',               icon: 'account_balance_wallet' },
    {label: 'Upravljanje računima',route: '/account-management',icon: 'account_balance'},
    { label: 'Primaoci plaćanja', route: '/payments/recipients', icon: 'people' },
  ];
}
