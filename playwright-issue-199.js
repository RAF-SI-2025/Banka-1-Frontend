// GHI #199 demo - Playwright skripta koja snima video + screenshots sa
// autentifikovanim Mateja Subin sesijom. Koristi se kao zamena za Cypress
// na Win11 26200 sandbox-u gde Cypress 14 ima smoke-test bug.
//
// Run:
//   node playwright-issue-199.js
//
// Output:
//   playwright-output/issue-199-demo.webm  - video celog flow-a
//   playwright-output/01-login.png ... 08-portfolio-after-sell.png

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.CYPRESS_BASE_URL || 'http://localhost:4200';
const API = process.env.CYPRESS_API_URL || 'http://localhost';
const CLIENT_EMAIL = process.env.CYPRESS_CLIENT_EMAIL || 'subin.mateja@gmail.com';
const CLIENT_PASSWORD = process.env.CYPRESS_CLIENT_PASSWORD || 'admin123';
const OUT_DIR = path.resolve(__dirname, 'playwright-output');

const STEP_PAUSE = 2000;
const SETTLEMENT_WAIT = 80_000;

function log(msg) {
  const ts = new Date().toISOString().substring(11, 19);
  console.log(`[${ts}] ${msg}`);
}

async function loginViaApi() {
  const res = await fetch(`${API}/clients/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CLIENT_EMAIL, password: CLIENT_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const body = await res.json();
  return body.token;
}

async function findUsdAccount(token) {
  const res = await fetch(`${API}/accounts/client/accounts?page=0&size=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  return (body.content || []).find((a) => a.currency === 'USD');
}

async function getPortfolio(token) {
  const res = await fetch(`${API}/order/portfolio`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
}

async function postBuy(token, accountId) {
  const res = await fetch(`${API}/order/orders/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ listingId: 1, quantity: 1, accountId, allOrNone: false, margin: false }),
  });
  if (!res.ok) throw new Error(`BUY failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function postSell(token, accountId) {
  const res = await fetch(`${API}/order/orders/sell`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ listingId: 1, quantity: 1, accountId, allOrNone: false, margin: false }),
  });
  if (!res.ok) throw new Error(`SELL failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function confirmOrder(token, orderId) {
  const res = await fetch(`${API}/order/orders/${orderId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`CONFIRM ${orderId} failed: ${res.status}`);
  return await res.json();
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  log('Login Mateja preko REST');
  const token = await loginViaApi();
  log(`Token len=${token.length}`);

  log('Pronalazim USD FX racun');
  const usd = await findUsdAccount(token);
  if (!usd) throw new Error('Nema USD FX racuna - run setup first');
  const accountId = usd.id;
  log(`USD account id=${accountId} (PK, NE hash)`);

  log('Provera portfolio-a');
  let port = await getPortfolio(token);
  let hasAapl = (port.holdings || []).some((h) => h.ticker === 'AAPL');

  if (!hasAapl) {
    log('Portfolio prazan - pokrecem BUY pre demo-a');
    const buy = await postBuy(token, accountId);
    log(`BUY id=${buy.id} accountId=${buy.accountId} price=${buy.pricePerUnit}`);
    const cnf = await confirmOrder(token, buy.id);
    log(`BUY CONFIRM status=${cnf.status} (Greska #9: 200 ne 500)`);
    log(`Cekam settlement ${SETTLEMENT_WAIT / 1000}s`);
    await new Promise((r) => setTimeout(r, SETTLEMENT_WAIT));
    port = await getPortfolio(token);
    hasAapl = (port.holdings || []).some((h) => h.ticker === 'AAPL');
    log(`Posle settlement-a: hasAapl=${hasAapl}`);
  } else {
    log('Portfolio vec ima AAPL - preskacem BUY');
  }

  log('Pokretanje Playwright Chromium');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: OUT_DIR, size: { width: 1440, height: 900 } },
  });
  const page = await ctx.newPage();

  // Seed localStorage pre nego sto Angular bootstrap-uje
  const role = (() => {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
      return payload.roles || 'CLIENT';
    } catch {
      return 'CLIENT';
    }
  })();
  await page.addInitScript(({ token, role, email }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('loggedUser', JSON.stringify({ email, role, permissions: ['BANKING_BASIC'] }));
  }, { token, role, email: CLIENT_EMAIL });

  log('Step 1: /login screen');
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(STEP_PAUSE);
  await page.screenshot({ path: path.join(OUT_DIR, '01-login.png'), fullPage: false });

  log('Step 2: /accounts - lista racuna');
  await page.goto(`${BASE}/accounts`);
  await page.waitForTimeout(STEP_PAUSE);
  try {
    await page.locator('text=/Lista računa|Lista racuna/i').first().waitFor({ timeout: 15_000 });
  } catch (e) {
    log(`Warning: heading not found, continuing - ${e.message}`);
  }
  await page.waitForTimeout(STEP_PAUSE);
  await page.screenshot({ path: path.join(OUT_DIR, '02-accounts-list.png'), fullPage: false });

  log('Step 3: /portfolio - AAPL pozicija');
  await page.goto(`${BASE}/portfolio`);
  await page.waitForTimeout(STEP_PAUSE);
  try {
    await page.locator('text=/AAPL|Apple/i').first().waitFor({ timeout: 30_000 });
    log('AAPL holding visible');
  } catch (e) {
    log(`Warning: AAPL not found - ${e.message}`);
  }
  await page.waitForTimeout(STEP_PAUSE);
  await page.screenshot({ path: path.join(OUT_DIR, '03-portfolio-with-aapl.png'), fullPage: false });

  log('Step 4: Klik dugme Prodaj - GRESKA #1 demo');
  try {
    const sellBtn = page.locator('button', { hasText: /Prodaj/i }).first();
    await sellBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '04-sell-button-visible.png'), fullPage: false });
    await sellBtn.click();
    await page.waitForTimeout(STEP_PAUSE);
    log(`URL posle klika: ${page.url()}`);
    if (/\/orders\/create\/SELL\/\d+/.test(page.url())) {
      log('GRESKA #1 FIX RADI: URL postao /orders/create/SELL/{listingId}');
    } else {
      log(`Warning: URL nije SELL forma`);
    }
    await page.waitForTimeout(STEP_PAUSE);
    await page.screenshot({ path: path.join(OUT_DIR, '05-sell-form-opened.png'), fullPage: false });
  } catch (e) {
    log(`Klik Prodaj failed: ${e.message}`);
  }

  log(`Step 5: SELL preko REST + cekam settlement ${SETTLEMENT_WAIT / 1000}s`);
  const sell = await postSell(token, accountId);
  log(`SELL id=${sell.id} price=${sell.pricePerUnit} fee=${sell.fee}`);
  const sellCnf = await confirmOrder(token, sell.id);
  log(`SELL CONFIRM status=${sellCnf.status}`);
  await page.waitForTimeout(SETTLEMENT_WAIT);

  log('Step 6: /portfolio posle SELL - prazan');
  await page.goto(`${BASE}/portfolio`);
  await page.waitForTimeout(STEP_PAUSE);
  await page.screenshot({ path: path.join(OUT_DIR, '06-portfolio-after-sell.png'), fullPage: false });

  log('Zatvaram browser i snimam video');
  await page.close();
  const videoPath = await ctx.close();
  log(`Video saved (browser context closed)`);

  await browser.close();

  // Rename video file to predictable name
  const videos = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.webm'));
  if (videos.length > 0) {
    const newPath = path.join(OUT_DIR, 'issue-199-demo.webm');
    fs.renameSync(path.join(OUT_DIR, videos[0]), newPath);
    log(`Video renamed to ${newPath}`);
  }

  log('GOTOVO. Output u playwright-output/');
})().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
