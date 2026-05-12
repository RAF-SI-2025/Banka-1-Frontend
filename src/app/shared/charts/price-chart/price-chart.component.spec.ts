import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PriceChartComponent } from './price-chart.component';
import { ThemeService } from '../../../core/services/theme.service';
import { BehaviorSubject } from 'rxjs';

describe('PriceChartComponent', () => {
  let fixture: ComponentFixture<PriceChartComponent>;
  let component: PriceChartComponent;
  let themeServiceStub: any;
  let effective$: BehaviorSubject<'light' | 'dark'>;

  beforeEach(async () => {
    effective$ = new BehaviorSubject<'light' | 'dark'>('light');
    themeServiceStub = {
      effective$: effective$.asObservable(),
      current: 'light',
    };

    await TestBed.configureTestingModule({
      imports: [PriceChartComponent],
      providers: [{ provide: ThemeService, useValue: themeServiceStub }],
    }).compileComponents();
    fixture = TestBed.createComponent(PriceChartComponent);
    component = fixture.componentInstance;
  });

  it('creates with default props', () => {
    fixture.detectChanges();
    expect(component.height).toBe(320);
    expect(component.type).toBe('area');
    expect(component.label).toBe('Cena');
  });

  it('binds series input', () => {
    component.series = [{ x: 1, y: 10 }, { x: 2, y: 20 }];
    component.ngOnInit();
    expect(component.apexSeries.length).toBe(1);
    expect((component.apexSeries[0].data as any).length).toBe(2);
  });

  it('builds options on theme change', () => {
    fixture.detectChanges();
    /* defaultni init sa light: */
    expect(component.options.chart).toBeDefined();
    /* simulate dark switch */
    effective$.next('dark');
    expect(component.options.theme?.mode).toBe('dark');
  });
});
