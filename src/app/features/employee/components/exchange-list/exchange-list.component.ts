import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '@/shared/components/navbar/navbar.component';
import { ExchangeService } from '../../services/exchange.service';

@Component({
  selector: 'app-exchange-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './exchange-list.component.html',
  styleUrls: ['./exchange-list.component.css']
})
export class ExchangeListComponent implements OnInit {

  exchanges: any[] = [];
  showOpenOnly = false;

  constructor(private exchangeService: ExchangeService) {}

  ngOnInit(): void {
    this.exchangeService.getExchanges().subscribe({
      next: (data) => {
        this.exchanges = data;
      },
      error: (err: any) => {
        console.error('API ne radi', err);
      }
    });
  }

}