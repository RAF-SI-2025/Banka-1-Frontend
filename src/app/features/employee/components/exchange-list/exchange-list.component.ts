import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExchangeManagerService, ExchangeInfo } from '../../services/exchange-manager.service';

@Component({
  selector: 'app-exchange-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exchange-list.component.html',
  styleUrls: ['./exchange-list.component.css']
})
export class ExchangeListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  exchanges: any[] = [];
  showOpenOnly = false;
  loadError = false;

  constructor(
    public exchangeManager: ExchangeManagerService
  ) {}

  ngOnInit(): void {
    // Eksplicitno učitaj berze kada se komponenta inicijalizuje
    this.exchangeManager.loadExchanges();

    // Pretplati se na promene dostupnih berzi (uključujući promene između mock i live podataka)
    this.exchangeManager.availableExchanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Exchange list komponenta primila podatke:', data);
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

    // Osvežavaj status berzi svakih 60 sekundi jer se vremenske zone menjaju
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Samo triggeruj change detection ponavljanjem niza
        this.exchanges = [...this.exchanges];
      });
  }

  /**
   * Vraća filtrirane berze na osnovu showOpenOnly
   */
  get filteredExchanges(): any[] {
    if (!this.showOpenOnly) {
      return this.exchanges;
    }
    return this.exchanges.filter(ex => this.exchangeManager.isExchangeOpen(ex));
  }

  /**
   * Spec Celina 3 (Sc 82): "dugme koje uključuje/isključuje vreme berze kako bi
   * mogli da testiramo aplikaciju i van vremena rada berzi". Backend toggle obrne
   * `isActive` polje (kada je `false`, server tretira berzu kao stalno otvorenu).
   */
  public toggleWorkingHours(exchange: ExchangeInfo, event: Event): void {
    event.stopPropagation();
    this.exchangeManager.toggleExchangeActive(exchange.id).subscribe({
      next: () => {
        exchange.isActive = !exchange.isActive;
        this.exchanges = [...this.exchanges];
      },
      error: (err) => {
        console.error('Toggle radnog vremena nije uspeo', err);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}