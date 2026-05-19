import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { environment } from '../../../../environments/environment';
import { WatchlistService } from './watchlist.service';
import { Watchlist, WatchlistItem } from '../models/watchlist.model';

const baseUrl = `${environment.apiUrl}/watchlists`;

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

describe('WatchlistService', () => {
  let service: WatchlistService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WatchlistService],
    });
    service = TestBed.inject(WatchlistService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getWatchlists GETs /watchlists', () => {
    let result: Watchlist[] | undefined;
    service.getWatchlists().subscribe((w) => (result = w));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    const body = [wl(1), wl(2)];
    req.flush(body);
    expect(result).toEqual(body);
  });

  it('createWatchlist POSTs the name', () => {
    let result: Watchlist | undefined;
    service.createWatchlist('Tech').subscribe((w) => (result = w));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Tech' });
    req.flush(wl(9, 'Tech'));
    expect(result).toEqual(wl(9, 'Tech'));
  });

  it('deleteWatchlist DELETEs /watchlists/{id}', () => {
    service.deleteWatchlist(7).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getItems GETs /watchlists/{id}/items with no filter by default', () => {
    let result: WatchlistItem[] | undefined;
    service.getItems(3).subscribe((i) => (result = i));

    const req = httpMock.expectOne(
      (r) => r.url === `${baseUrl}/3/items` && r.method === 'GET',
    );
    expect(req.request.params.has('listingType')).toBeFalse();
    const body = [item(1), item(2)];
    req.flush(body);
    expect(result).toEqual(body);
  });

  it('getItems forwards the listingType filter when given', () => {
    service.getItems(3, 'FOREX').subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === `${baseUrl}/3/items`,
    );
    expect(req.request.params.get('listingType')).toBe('FOREX');
    req.flush([]);
  });

  it('addItem POSTs the listingId to /watchlists/{id}/items', () => {
    service.addItem(3, 555).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/3/items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ listingId: 555 });
    req.flush(item(1));
  });

  it('removeItem DELETEs /watchlists/{id}/items/{itemId}', () => {
    service.removeItem(3, 88).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/3/items/88`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
