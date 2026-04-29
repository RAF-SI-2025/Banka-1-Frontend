import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NavbarComponent } from '@/shared/components/navbar/navbar.component';
import { ExchangeManagerService } from '../../services/exchange-manager.service';
import { ToastService } from '@/shared/services/toast.service'; 

@Component({
  selector: 'app-exchange-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './exchange-list.component.html',
  styleUrls: ['./exchange-list.component.css']
})
export class ExchangeListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  exchanges: any[] = [];
  showOpenOnly = false;
  loadError = false;

  constructor(
    private exchangeManager: ExchangeManagerService,
    private toastService: ToastService         
  ) {}

  ngOnInit(): void {
    // Pretplati se na promene dostupnih berzi (uključujući promene između mock i live podataka)
    this.exchangeManager.availableExchanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.exchanges = data;
        },
        error: (err: any) => {
          console.error('Greška pri učitavanju berzi', err);
        }
      });

    // Pretplati se na greške pri učitavanju
    this.exchangeManager.loadError$
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasError => {
        this.loadError = hasError;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleActive(exchange: any): void {
    const previousStatus = exchange.isActive;
    exchange.isActive = !exchange.isActive;

    // Koristimo exchangeManager (jer si ga tako nazvao u konstruktoru), a ne exchangeService
    this.exchangeManager.toggleExchangeActive(exchange.id).subscribe({
      next: () => {
        this.toastService.success(`Status za ${exchange.exchangeName} uspešno promenjen.`);
      },
      error: (err: any) => {
        console.error('Greška:', err);
        exchange.isActive = previousStatus;
        this.toastService.error('Greška pri komunikaciji sa serverom.');
      }
    });
  }

}