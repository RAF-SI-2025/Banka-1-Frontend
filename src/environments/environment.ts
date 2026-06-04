// PR_29: production environment.
//
// Pre PR_29: hardkodiran `apiUrl: 'http://localhost'` koji je radio samo u dev docker-compose
// setup-u. U realnom prod deploy-u (npr. https://app.banka1.example.com) bandled JS bi
// pokusao da pozove http://localhost i pao bi sa CORS / connection refused greskom.
//
// Sada vrednost moze da se override-uje u runtime-u kroz `window.__BANKA_ENV__.apiUrl`,
// sto se postavlja iz `assets/env-config.js` (taj fajl operator menja u trenutku deploy-a
// bez rebuilda Angular bundle-a). Default fallback je relativni '' (= same origin),
// sto znaci da Nginx koji servira frontend mora da reverse-proxy-uje API path-e ka gateway-u.
//
// Da bi se za development setup nasem `ng serve`-u dao apsolutni URL ka api-gateway-u na :80,
// koristi se `environment.development.ts` (preko angular.json fileReplacements).
declare const window: { __BANKA_ENV__?: { apiUrl?: string } };

const runtimeApiUrl =
  typeof window !== 'undefined' && window?.__BANKA_ENV__?.apiUrl;

export const environment = {
  production: true,
  apiUrl: runtimeApiUrl ?? '',
};
