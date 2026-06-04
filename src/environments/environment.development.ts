// PR_29: development environment.
// `ng serve` (port 4200) i docker-compose dev setup koriste ovo da bi SPA pricala sa
// api-gateway-em na http://localhost (port 80, host network). Runtime override (window
// global) i dalje pobedjuje apsolutni URL ako je postavljen — korisno kad operator
// jednostavno hoce da prebaci dev SPA na staging gateway bez rebuilda.
declare const window: { __BANKA_ENV__?: { apiUrl?: string } };

const runtimeApiUrl =
  typeof window !== 'undefined' && window?.__BANKA_ENV__?.apiUrl;

export const environment = {
  production: false,
  apiUrl: runtimeApiUrl ?? 'http://localhost',
};
