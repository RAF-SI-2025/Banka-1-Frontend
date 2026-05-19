import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { WatchlistPageComponent } from './watchlist-page.component';
import { WatchlistService } from '../../services/watchlist.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Watchlist, WatchlistItem } from '../../models/watchlist.model';

function wl(id: number, name = `WL ${id}`): Watchlist {
  return { id, name };
}

function item(id: number, overrides: Partial<WatchlistItem> = {}): WatchlistItem {
  return {
    id,
    listingId: 100 + id,
    ticker: `TKR${id}`,
    name: `Security ${id}`,
    price: 50,
    change: 1.5,
    volume: 1000,
    listingType: 'STOCK',
    ...overrides,
  };
}

describe('WatchlistPageComponent', () => {
  let fixture: ComponentFixture<WatchlistPageComponent>;
  let component: WatchlistPageComponent;
  let service: jasmine.SpyObj<WatchlistService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('WatchlistService', [
      'getWatchlists',
      'createWatchlist',
      'deleteWatchlist',
      'getItems',
      'addItem',
      'removeItem',
    ]);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);

    service.getWatchlists.and.returnValue(of([]));
    service.getItems.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [WatchlistPageComponent, RouterTestingModule],
      providers: [
        { provide: WatchlistService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WatchlistPageComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads watchlists on init and auto-selects the first one', () => {
    service.getWatchlists.and.returnValue(of([wl(1), wl(2)]));
    service.getItems.and.returnValue(of([item(1)]));
    fixture.detectChanges();

    expect(component.watchlists.length).toBe(2);
    expect(component.selectedWatchlist?.id).toBe(1);
    expect(service.getItems).toHaveBeenCalledWith(1, undefined);
    expect(component.items.length).toBe(1);
  });

  it('shows an error when watchlists fail to load', () => {
    service.getWatchlists.and.returnValue(throwError(() => new Error('down')));
    fixture.detectChanges();
    expect(component.error).toBe('Greska pri ucitavanju watchlista.');
  });

  it('selectWatchlist loads that watchlist items', () => {
    service.getWatchlists.and.returnValue(of([wl(1), wl(2)]));
    service.getItems.and.returnValue(of([]));
    fixture.detectChanges();

    component.selectWatchlist(wl(2));
    expect(component.selectedWatchlist?.id).toBe(2);
    expect(service.getItems).toHaveBeenCalledWith(2, undefined);
  });

  it('onTypeFilterChange reloads items with the chosen listingType', () => {
    service.getWatchlists.and.returnValue(of([wl(1)]));
    service.getItems.and.returnValue(of([]));
    fixture.detectChanges();

    component.typeFilter = 'FOREX';
    component.onTypeFilterChange();
    expect(service.getItems).toHaveBeenCalledWith(1, 'FOREX');
  });

  it('createWatchlist rejects an empty name without calling the service', () => {
    fixture.detectChanges();
    component.newName = '   ';
    component.createWatchlist();
    expect(service.createWatchlist).not.toHaveBeenCalled();
    expect(component.createError).toBe('Naziv je obavezan.');
  });

  it('createWatchlist posts a trimmed name and reloads on success', () => {
    service.getWatchlists.and.returnValue(of([]));
    service.createWatchlist.and.returnValue(of(wl(9, 'Tech')));
    fixture.detectChanges();
    service.getWatchlists.calls.reset();

    component.newName = '  Tech  ';
    component.createWatchlist();

    expect(service.createWatchlist).toHaveBeenCalledWith('Tech');
    expect(component.createModalOpen).toBeFalse();
    expect(toast.success).toHaveBeenCalled();
    expect(service.getWatchlists).toHaveBeenCalled();
  });

  it('createWatchlist surfaces an error and keeps the modal open', () => {
    service.createWatchlist.and.returnValue(throwError(() => new Error('boom')));
    fixture.detectChanges();

    component.newName = 'X';
    component.createWatchlist();
    expect(component.createError).toBe('Greska pri kreiranju watchlista.');
    expect(component.creating).toBeFalse();
  });

  it('removeItem removes from the selected watchlist and reloads items', () => {
    service.getWatchlists.and.returnValue(of([wl(1)]));
    service.getItems.and.returnValue(of([item(5)]));
    service.removeItem.and.returnValue(of(void 0));
    fixture.detectChanges();
    service.getItems.calls.reset();

    component.removeItem(item(5));
    expect(service.removeItem).toHaveBeenCalledWith(1, 5);
    expect(service.getItems).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('detailLink maps listingType to the right securities route segment', () => {
    expect(component.detailLink(item(1, { listingType: 'STOCK', listingId: 7 }))).toEqual([
      '/securities',
      'stock',
      '7',
    ]);
    expect(component.detailLink(item(1, { listingType: 'FUTURE', listingId: 8 }))).toEqual([
      '/securities',
      'future',
      '8',
    ]);
    expect(component.detailLink(item(1, { listingType: 'FOREX', listingId: 9 }))).toEqual([
      '/securities',
      'forex',
      '9',
    ]);
  });
});
