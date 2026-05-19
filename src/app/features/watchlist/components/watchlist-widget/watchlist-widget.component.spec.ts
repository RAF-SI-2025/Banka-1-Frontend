import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { WatchlistWidgetComponent } from './watchlist-widget.component';
import { WatchlistService } from '../../services/watchlist.service';
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

describe('WatchlistWidgetComponent', () => {
  let fixture: ComponentFixture<WatchlistWidgetComponent>;
  let component: WatchlistWidgetComponent;
  let service: jasmine.SpyObj<WatchlistService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('WatchlistService', ['getWatchlists', 'getItems']);
    service.getWatchlists.and.returnValue(of([]));
    service.getItems.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [WatchlistWidgetComponent, RouterTestingModule],
      providers: [{ provide: WatchlistService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(WatchlistWidgetComponent);
    component = fixture.componentInstance;
  });

  it('does not fetch while closed', () => {
    component.open = false;
    fixture.detectChanges();
    expect(service.getWatchlists).not.toHaveBeenCalled();
  });

  it('fetches the first watchlist and its items when opened', () => {
    service.getWatchlists.and.returnValue(of([wl(1), wl(2)]));
    service.getItems.and.returnValue(of([item(1), item(2)]));

    component.open = true;
    component.ngOnChanges();

    expect(service.getWatchlists).toHaveBeenCalled();
    expect(service.getItems).toHaveBeenCalledWith(1);
    expect(component.items.length).toBe(2);
    expect(component.watchlist?.id).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('does not refetch on a second open', () => {
    service.getWatchlists.and.returnValue(of([wl(1)]));
    service.getItems.and.returnValue(of([]));

    component.open = true;
    component.ngOnChanges();
    service.getWatchlists.calls.reset();

    component.ngOnChanges();
    expect(service.getWatchlists).not.toHaveBeenCalled();
  });

  it('handles having no watchlists gracefully', () => {
    service.getWatchlists.and.returnValue(of([]));
    component.open = true;
    component.ngOnChanges();

    expect(component.watchlist).toBeNull();
    expect(component.items).toEqual([]);
    expect(component.loading).toBeFalse();
    expect(service.getItems).not.toHaveBeenCalled();
  });

  it('sets the error flag when the watchlist fetch fails', () => {
    service.getWatchlists.and.returnValue(throwError(() => new Error('down')));
    component.open = true;
    component.ngOnChanges();
    expect(component.error).toBeTrue();
  });

  it('sets the error flag when the item fetch fails', () => {
    service.getWatchlists.and.returnValue(of([wl(1)]));
    service.getItems.and.returnValue(throwError(() => new Error('down')));
    component.open = true;
    component.ngOnChanges();
    expect(component.error).toBeTrue();
  });

  it('detailLink maps listingType to the right route segment', () => {
    expect(component.detailLink(item(1, { listingType: 'FOREX', listingId: 5 }))).toEqual([
      '/securities',
      'forex',
      '5',
    ]);
  });
});
