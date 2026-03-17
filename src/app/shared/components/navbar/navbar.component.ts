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
    { label: 'Računi',     route: '/accounts',  icon: 'account_balance' },
    { label: 'Plaćanja',   route: '/payments',  icon: 'payments' },
    { label: 'Transferi',  route: '/transfers', icon: 'swap_horiz' },
    { label: 'Menjačnica', route: '/exchange',  icon: 'currency_exchange' },
    { label: 'Kartice',    route: '/cards',     icon: 'credit_card' },
    { label: 'Krediti',    route: '/loans',     icon: 'account_balance_wallet' }
  ];
}
