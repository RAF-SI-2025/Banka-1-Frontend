import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MyOrdersComponent } from './my-orders.component';
import { MyOrderService } from '../../services/my-order.service';
import { MyOrder, MyOrderPage } from '../../models/my-order.model';

function order(id: number, overrides: Partial<MyOrder> = {}): MyOrder {
  return {
    id,
    orderType: 'MARKET',
    listingType: 'STOCK',
    ticker: `TKR${id}`,
    securityName: `Security ${id}`,
    quantity: 10,
    pricePerUnit: 100,
    status: 'DONE',
    direction: 'BUY',
    createdAt: '2026-05-01T10:00:00Z',
    lastModification: '2026-05-01T10:05:00Z',
    fee: 7,
    ...overrides,
  };
}

function page(content: MyOrder[], totalElements = content.length): MyOrderPage {
  return {
    content,
    page: {
      size: 10,
      number: 0,
      totalElements,
      totalPages: Math.max(1, Math.ceil(totalElements / 10)),
    },
  };
}

describe('MyOrdersComponent', () => {
  let fixture: ComponentFixture<MyOrdersComponent>;
  let component: MyOrdersComponent;
  let myOrderService: jasmine.SpyObj<MyOrderService>;

  beforeEach(async () => {
    myOrderService = jasmine.createSpyObj('MyOrderService', ['getMyOrders']);
    myOrderService.getMyOrders.and.returnValue(of(page([])));

    await TestBed.configureTestingModule({
      imports: [MyOrdersComponent],
      providers: [{ provide: MyOrderService, useValue: myOrderService }],
    }).compileComponents();

    fixture = TestBed.createComponent(MyOrdersComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads the first page on init', () => {
    myOrderService.getMyOrders.and.returnValue(of(page([order(1), order(2)], 2)));
    fixture.detectChanges();

    expect(myOrderService.getMyOrders).toHaveBeenCalledWith({}, 0, 10);
    expect(component.orders.length).toBe(2);
    expect(component.totalElements).toBe(2);
    expect(component.isLoading).toBeFalse();
  });

  it('sets an error message when the history fails to load', () => {
    myOrderService.getMyOrders.and.returnValue(throwError(() => new Error('network')));
    fixture.detectChanges();

    expect(component.error).toBe('Greska pri ucitavanju ordera.');
    expect(component.isLoading).toBeFalse();
  });

  it('applyFilters resets to page 0 and forwards the filter', () => {
    fixture.detectChanges();
    component.currentPage = 4;
    component.statusFilter = 'DONE';
    component.directionFilter = 'SELL';
    component.securityTypeFilter = 'STOCK';
    component.fromDate = '2026-01-01';
    component.toDate = '2026-05-19';

    component.applyFilters();

    expect(component.currentPage).toBe(0);
    expect(myOrderService.getMyOrders).toHaveBeenCalledWith(
      {
        status: 'DONE',
        direction: 'SELL',
        securityType: 'STOCK',
        from: '2026-01-01',
        to: '2026-05-19',
      },
      0,
      10,
    );
  });

  it('clearFilters wipes every field and reloads with an empty filter', () => {
    fixture.detectChanges();
    component.statusFilter = 'DONE';
    component.directionFilter = 'BUY';
    component.securityTypeFilter = 'FOREX';
    component.fromDate = '2026-01-01';
    component.toDate = '2026-05-19';
    myOrderService.getMyOrders.calls.reset();

    component.clearFilters();

    expect(component.statusFilter).toBe('');
    expect(component.directionFilter).toBe('');
    expect(component.securityTypeFilter).toBe('');
    expect(component.fromDate).toBe('');
    expect(component.toDate).toBe('');
    expect(myOrderService.getMyOrders).toHaveBeenCalledWith({}, 0, 10);
  });

  it('onPageChange reloads with the new 0-indexed page', () => {
    myOrderService.getMyOrders.and.returnValue(of(page([], 50)));
    fixture.detectChanges();

    component.onPageChange(3);
    expect(component.currentPage).toBe(3);
    expect(myOrderService.getMyOrders).toHaveBeenCalledWith({}, 3, 10);
  });

  it('statusBadgeClass maps statuses to the right palette', () => {
    expect(component.statusBadgeClass('DONE')).toContain('z-badge-green');
    expect(component.statusBadgeClass('PENDING')).toContain('z-badge-yellow');
    expect(component.statusBadgeClass('CANCELLED')).toContain('z-badge-red');
  });

  it('directionLabel returns Serbian labels', () => {
    expect(component.directionLabel('BUY')).toBe('Kupovina');
    expect(component.directionLabel('SELL')).toBe('Prodaja');
  });
});
