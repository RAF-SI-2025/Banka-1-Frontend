import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type SecurityListingType = 'STOCK' | 'FUTURE' | 'FOREX' | 'OPTION';

export interface WatchlistItemDto {
  id: number;
  listingId: number;
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  listingType: SecurityListingType;
}

export interface WatchlistDto {
  id: number;
  name: string;
  items?: WatchlistItemDto[];
}

@Injectable({
  providedIn: 'root',
})
export class WatchlistService {
  private readonly baseUrl = `${environment.apiUrl}/watchlists`;

  constructor(private readonly http: HttpClient) {}

  getWatchlists(): Observable<WatchlistDto[]> {
    return this.http.get<WatchlistDto[]>(this.baseUrl);
  }

  getWatchlist(id: number, listingType?: SecurityListingType): Observable<WatchlistDto> {
    let params = new HttpParams();
    if (listingType) {
      params = params.set('listingType', listingType);
    }
    return this.http.get<WatchlistDto>(`${this.baseUrl}/${id}`, { params });
  }

  createWatchlist(name: string): Observable<WatchlistDto> {
    return this.http.post<WatchlistDto>(this.baseUrl, { name });
  }

  deleteWatchlist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addItemToWatchlist(watchlistId: number, listingId: number): Observable<WatchlistItemDto> {
    return this.http.post<WatchlistItemDto>(`${this.baseUrl}/${watchlistId}/items`, { listingId });
  }

  removeItemFromWatchlist(watchlistId: number, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${watchlistId}/items/${itemId}`);
  }
}
