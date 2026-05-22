import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { OtcEtagCache } from './otc-etag-cache';

describe('OtcEtagCache', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let cache: OtcEtagCache;

  const url = 'http://localhost/otc/offers/active';

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    cache = new OtcEtagCache(http);
  });

  afterEach(() => httpMock.verify());

  it('stores ETag from 200 response', () => {
    const body = [{ id: 1 }];
    cache.getJson<typeof body>(url).subscribe((res) => expect(res).toEqual(body));

    const req = httpMock.expectOne(url);
    expect(req.request.headers.has('If-None-Match')).toBe(false);
    req.flush(body, { headers: new HttpHeaders({ ETag: '"v1"' }) });
  });

  it('sends If-None-Match and returns cached body on 304', () => {
    const body = [{ id: 1 }];

    cache.getJson(url).subscribe();
    httpMock.expectOne(url).flush(body, { headers: new HttpHeaders({ ETag: '"v1"' }) });

    cache.getJson<typeof body>(url).subscribe((res) => expect(res).toEqual(body));
    const req2 = httpMock.expectOne(url);
    expect(req2.request.headers.get('If-None-Match')).toBe('"v1"');
    req2.flush(null, { status: 304, statusText: 'Not Modified' });
  });
});
