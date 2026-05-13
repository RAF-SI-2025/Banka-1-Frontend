import { Component, OnInit } from '@angular/core';
import { ActuaryPerformance } from '../../models/actuary-performance';
import { ActuaryService } from '../../services/actuary.service';

@Component({
  selector: 'app-actuary-performances',
  templateUrl: './actuary-performances.component.html',
  styleUrls: ['./actuary-performances.component.scss']
})
export class ActuaryPerformancesComponent implements OnInit {
  performances: ActuaryPerformance[] = [];
  isLoading = false;

  constructor(private actuaryService: ActuaryService) {}

  ngOnInit(): void {
    this.loadPerformances();
  }

  loadPerformances(): void {
    this.isLoading = true;

    this.actuaryService.getActuaryPerformances().subscribe({
      next: (data) => {
        this.performances = data.sort((a, b) => b.profit - a.profit);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Greška pri učitavanju performansi aktuara:', err);
        this.performances = [];
        this.isLoading = false;
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}