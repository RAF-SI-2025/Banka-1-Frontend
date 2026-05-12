// PR_29: Runtime environment configuration.
//
// Operatori mogu da edit-uju ovaj fajl u trenutku deploy-a (ili da ga generisu kroz
// docker entrypoint script iz env vars), bez rebuild-a Angular bundle-a. SPA cita
// `window.__BANKA_ENV__.apiUrl` u environment.ts/environment.development.ts.
//
// PR_30: dev default je 'http://localhost' jer je SPA u Docker compose-u serviran iz
// frontend nginx kontejnera (port 4200 -> :80) koji NEMA reverse proxy ka api-gateway-u.
// Bez ovog default-a, SPA bi POST-ovao na same-origin (port 4200) -> 405 Method Not Allowed.
//
// Za PROD: ili (a) postavi apsolutni URL ovde (npr. 'https://api.banka1.example.com'),
// ili (b) ostavi prazno + dodaj reverse-proxy lokacije u frontend nginx.conf koje proxy_pass
// API path-e (`/employees/`, `/clients/`, `/accounts/`, `/transactions/`, ...) na
// `http://api-gateway:80` (interna Docker mreza).
window.__BANKA_ENV__ = window.__BANKA_ENV__ || {};
window.__BANKA_ENV__.apiUrl = window.__BANKA_ENV__.apiUrl || 'http://localhost';
