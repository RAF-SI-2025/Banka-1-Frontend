import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { WatchlistPickerComponent } from './watchlist-picker.component';
import { WatchlistService } from '../../services/watchlist.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Watchlist, WatchlistItem } from '../../models/watchlist.model';

function wl(id: number, name = `WL ${id}`): Watchlist {
  return { id, name };
}

function flushedItem(): WatchlistItem {
  return {
    id: 1,
    listingId: 999,
    ticker: 'X',
    name: 'X',
    price: 1,
    change: 0,
    volume: 0,
    listingType: 'STOCK',
  };
}

describe('WatchlistPickerComponent', () => {
  let fixture: ComponentFixture<WatchlistPickerComponent>;
  let component: WatchlistPickerComponent;
  let service: jasmine.SpyObj<WatchlistService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('WatchlistService', ['getWatchlists', 'addItem']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    service.getWatchlists.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [WatchlistPickerComponent],
      providers: [
        { provide: WatchlistService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WatchlistPickerComponent);
    component = fixture.componentInstance;
    component.listingId = 999;
  });

  it('creates and loads watchlists on init', () => {
    service.getWatchlists.and.returnValue(of([wl(1), wl(2)]));
    fixture.detectChanges();
    expect(component.watchlists.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('shows an error when watchlists fail to load', () => {
    service.getWatchlists.and.returnValue(throwError(() => new Error('down')));
    fixture.detectChanges();
    expect(component.loadError).toBe('Greska pri ucitavanju watchlista.');
  });

  it('pick adds the listing to the chosen watchlist and closes', () => {
    service.getWatchlists.and.returnValue(of([wl(3)]));
    service.addItem.and.returnValue(of(flushedItem()));
    fixture.detectChanges();

    const closeSpy = jasmine.createSpy('close');
    const addedSpy = jasmine.createSpy('added');
    component.close.subscribe(closeSpy);
    component.added.subscribe(addedSpy);

    component.pick(wl(3));

    expect(service.addItem).toHaveBeenCalledWith(3, 999);
    expect(toast.success).toHaveBeenCalled();
    expect(addedSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('pick surfaces a warning toast on a 409 duplicate', () => {
    service.getWatchlists.and.returnValue(of([wl(3)]));
    service.addItem.and.returnValue(throwError(() => ({ status: 409 })));
    fixture.detectChanges();

    component.pick(wl(3));
    expect(toast.warning).toHaveBeenCalled();
    expect(component.adding).toBeFalse();
  });

  it('pick surfaces an error toast on a 404 missing listing', () => {
    service.getWatchlists.and.returnValue(of([wl(3)]));
    service.addItem.and.returnValue(throwError(() => ({ status: 404 })));
    fixture.detectChanges();

    component.pick(wl(3));
    expect(toast.error).toHaveBeenCalled();
  });
});
