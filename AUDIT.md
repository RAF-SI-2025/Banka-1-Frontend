# Frontend Audit – Celina 1, 2, 3

> Stanje na dan: 2026-04-21  
> Analizirane specifikacije: `Celina 1.md`, `Celina 2.md`, `Celina 3.md`

---

## Legenda

| Oznaka | Značenje |
|--------|----------|
| ✅ | Implementirano |
| ❌ | Nije implementirano / Fali |
| ⚠️ | Delimično ili netačno implementirano |

---

## Celina 1 – Upravljanje korisnicima

### Šta je urađeno

| # | Funkcionalnost | Status |
|---|---|---|
| 1 | Login stranica (email + lozinka) | ✅ |
| 2 | Zaboravljena lozinka – slanje linka na email | ✅ |
| 3 | Reset lozinke putem email linka | ✅ |
| 4 | Aktivacija naloga zaposlenog putem email linka + forma za unos lozinke (2 polja) | ✅ |
| 5 | Lista svih zaposlenih sa filterima (email, ime/prezime, pozicija) | ✅ |
| 6 | Kreiranje zaposlenog bez lozinke (admin) | ✅ |
| 7 | Editovanje zaposlenog – sva polja osim ID i lozinke | ✅ |
| 8 | Upravljanje permisijama zaposlenog (uključujući admin) | ✅ |
| 9 | Deaktivacija zaposlenog | ✅ |
| 10 | Auth guard / Role guard (zaštita ruta) | ✅ |
| 11 | Access/refresh token autentifikacija (interceptor) | ✅ |

### Šta nedostaje ili nije ispravno

| # | Funkcionalnost | Problem |
|---|---|---|
| 1 | **Password constraints validacija** | Spec zahteva 8–32 karaktera, min. 2 broja, 1 veliko i 1 malo slovo. Nije verifikovano da li je validacija implementirana na frontendu. |
| 2 | **Confirmation email posle aktivacije naloga** | Spec kaže da zaposleni dobija confirmation mail. Nije verifikovano da li frontend prikazuje odgovarajuću poruku ili okida email. |
| 3 | **Admin ne može editovati drugog admina** | Spec kaže: "Jedan admin ne može da edituje drugog admina." UI nije proveren da li blokira ovu akciju. |
| 4 | **Session expiry zatvaranjem pretraživača** | Spec kaže da zatvaranjem pretraživača mora biti potrebno ponovni login. Nije verifikovano da li se koristi `sessionStorage` umesto `localStorage`. |

---

## Celina 2 – Osnovno poslovanje banke

### Šta je urađeno

| # | Funkcionalnost | Status |
|---|---|---|
| 1 | Kreiranje tekućeg računa (podvrste: lični, poslovni) sa izborom valute | ✅ |
| 2 | Kreiranje deviznog računa (lični / poslovni, sa izborom valute iz skupa EUR/CHF/USD/GBP/JPY/CAD/AUD) | ✅ |
| 3 | Checkbox "Napravi karticu" pri kreiranju računa | ✅ |
| 4 | Unos početnog stanja računa | ✅ |
| 5 | Odabir postojećeg klijenta ili kreiranje novog pri kreiranju računa | ✅ |
| 6 | Podaci o firmi za poslovni račun (naziv, matični broj, PIB, šifra delatnosti, adresa) | ✅ |
| 7 | Lista klijenata za zaposlene sa pregledom i filterima | ✅ |
| 8 | Detaljan prikaz klijenta za zaposlene | ✅ |
| 9 | Portal za upravljanje računima (lista, pretraga, blokiranje/brisanje računa) | ✅ |
| 10 | Upravljanje karticama za zaposlene (po računu: blokiraj, odblokiraj, deaktiviraj) | ✅ |
| 11 | Home stranica – pregled raspoloživog stanja | ✅ |
| 12 | Home stranica – pregled poslednjih transakcija po izabranom računu | ✅ |
| 13 | Lista računa klijenta (samo aktivni, sortirani opadajuće po raspoloživom stanju) | ✅ |
| 14 | Dugme "Detalji" za svaki račun | ✅ |
| 15 | Detaljan prikaz računa (lični i poslovni) | ✅ |
| 16 | Promena naziva računa (pop-up, validacija jedinstvenosti) | ✅ |
| 17 | Promena limita (zahteva verifikacioni kod) | ✅ |
| 18 | Verifikacioni modal (unos koda) | ✅ |
| 19 | Novo plaćanje (sva polja: primalac, račun primaoca, iznos, poziv na broj, šifra, svrha, račun platioca) | ✅ |
| 20 | Dodavanje primaoca plaćanja iz forme novog plaćanja | ✅ |
| 21 | Primaoci plaćanja – pregled, kreiranje, izmena, brisanje | ✅ |
| 22 | Pregled plaćanja sa filterima | ✅ |
| 23 | Detalji transakcije u modalu | ✅ |
| 24 | "Štampaj potvrdu" u detaljima transakcije | ✅ |
| 25 | Transfer između sopstvenih računa iste valute | ✅ |
| 26 | Transfer između sopstvenih računa različite valute (kroz kurs banke sa provizijom) | ✅ |
| 27 | Kursna lista (Exchange rate stranica) | ✅ |
| 28 | Kalkulator menjačnice | ✅ |
| 29 | Lista kartica klijenta (grupisana po računu, maskirani broj, status, dugme blokiraj) | ✅ |
| 30 | Zahtev za novu karticu (klijent) | ✅ |
| 31 | Lista kredita klijenta (sortirano opadajuće po iznosu) | ✅ |
| 32 | Detaljan prikaz kredita (sve informacije prema specifikaciji) | ✅ |
| 33 | Podnošenje zahteva za kredit | ✅ |
| 34 | Portal za upravljanje zahtevima za kredit (zaposleni) | ✅ |
| 35 | Portal za upravljanje kreditima (zaposleni) | ✅ |

### Šta nedostaje ili nije ispravno

| # | Funkcionalnost | Problem |
|---|---|---|
| 1 | **Home – "Brzo plaćanje"** | Prikazuje se placeholder "dostupno uskoro". Spec zahteva prikaz primaoca plaćanja i mogućnost brzog plaćanja direktno sa početne stranice. |
| 2 | **Home – Kalkulator menjačnice** | Prikazuje se placeholder "dostupno uskoro". Spec zahteva kalkulator/kursnu listu na početnoj stranici. |
| 3 | **"Prenos" kao zasebna opcija u Plaćanjima** | Spec definiše Plaćanja podmeni s 4 opcije: Novo plaćanje, Prenos, Primaoci plaćanja, Pregled plaćanja. "Prenos" (između računa različitih klijenata, iste valute) ne postoji kao zasebna ruta/stranica – nedostaje ili je spajan sa "Novo plaćanje" bez ograničenja na istu valutu. |
| 4 | **Detaljan prikaz poslovnog računa – podatak o firmi** | Spec zahteva da se u detaljnom prikazu poslovnog računa vide i podaci o firmi (npr. naziv firme). Nije verifikovano da li modala/stranica prikazuje ove podatke. |
| 5 | **Vraćanje na formu kreiranja računa posle kreacije novog klijenta** | Spec zahteva da posle kreiranja novog klijenta aplikacija automatski vrati korisnika na formu kreiranja računa i automatski popuni vlasnika. Tok nije potpuno jasno implementiran. |

---

## Celina 3 – Trgovina na berzi

### Šta je urađeno

| # | Funkcionalnost | Status |
|---|---|---|
| 1 | Portal hartija od vrednosti – tabovi: Akcije, Fjučersi, Forex parovi | ✅ |
| 2 | Klijenti vide samo Akcije i Fjučerse (Forex tab skriven za klijente) | ✅ |
| 3 | Pretraga po tikeru ili nazivu | ✅ |
| 4 | Filtriranje (Exchange prefix, Price/Ask/Bid/Volume raspon, Settlement date za futures) | ✅ |
| 5 | Sortiranje (ticker, naziv, cena, promena, volumen, marža) | ✅ |
| 6 | Dugme za ručno osvežavanje podataka | ✅ |
| 7 | Paginacija liste hartija | ✅ |
| 8 | Klik na red → detaljan prikaz hartije | ✅ |
| 9 | Detaljan prikaz akcije (ticker, berza, cena, promena, volumen, marža) | ✅ |
| 10 | Grafik cene akcije sa izborom perioda (dan, nedelja, mesec, godina itd.) | ✅ |
| 11 | Tabela opcija (CALLS/PUTS) sa in-the-money/out-of-money bojama | ✅ |
| 12 | Filter za broj strikova (na svaku stranu) i datum isteka opcija | ✅ |
| 13 | Prikaz Shared Price u tabeli opcija | ✅ |
| 14 | Detaljan prikaz fjučersa i forex para (grafik + atributi) | ✅ |
| 15 | Lista berzi (Exchange list) – naziv, akronim, MIC kod, država, valuta, vremenska zona, radno vreme, status otvoreno/zatvoreno | ✅ |
| 16 | Portal za upravljanje aktuarima – lista agenata, filtriranje, izmena limita, reset usedLimit | ✅ |

### Šta nedostaje ili nije ispravno

| # | Funkcionalnost | Problem |
|---|---|---|
| 1 | **Portal "Moj portfolio"** | Stranica potpuno nedostaje. Spec zahteva: prikaz posedovanih hartija (tip, ticker, amount, price, profit, last modified), dugme "Prodaj" za sve tipove, iskorišćavanje opcije (za aktuare), sekciju Profita i sekciju Poreza (plaćen/neplaćen za tekuću godinu/mesec). |
| 2 | **Portal "Pregled ordera"** | Stranica potpuno nedostaje. Spec zahteva (samo za supervizore): tabelu sa orderima (agent, tip, hartija, količina, contract size, cena, smer, remaining portions, status), filtriranje po statusu (All/Pending/Approved/Declined/Done), dugmad Approve/Decline, otkazivanje ordera. |
| 3 | **Portal "Porez tracking"** | Stranica potpuno nedostaje. Spec zahteva (samo za supervizore): pregled oporezovane/neoporezovane dobiti po korisnicima i ručno pokretanje naplate mesečnog poreza. |
| 4 | **Kreiranje ordera (Buy/Sell dialog)** | Dugme "Kupi" na listi hartija je **stub** – samo ispisuje poruku u konzolu (`console.log`) i nema nikakvu implementaciju. Nije implementirano: dialog za kreiranje ordera (Market/Limit/Stop/Stop-Limit), AON opcija, Margin opcija, izbor računa, approximativna cena, confirmation dialog, provjera limita agenta, status "Need Approval". |
| 5 | **Sell order (iz portfolia)** | Ne postoji ni stranica portfolia ni "Prodaj" flow za kreiranje sell ordera. |
| 6 | **Kupovina opcija sa detalja akcije** | Tabela opcija (CALLS/PUTS) prikazuje podatke, ali **nema Buy dugmeta** za pojedinačne opcije. Aktuari ne mogu kreirati nalog za kupovinu opcije. |
| 7 | **Toggle za isključivanje provere vremena berze** | Spec zahteva dugme "koje uključuje/isključuje vreme berze" radi testiranja (da se može kreirati order i van radnog vremena berze). Postojeći toggle na Exchange listi filtrira samo prikaz otvorenih berzi – ne onemogućava/omogućava vremensku proveru na nivou ordera. |
| 8 | **Upozorenje o "after-hours" stanju** | Spec zahteva da korisnik bude obavešten ako je berza zatvorena ili ako se order pravi unutar 4h od zatvaranja (after-hours), sa sporijim izvršavanjem (+30 min po delu ordera). Nije implementirano. |
| 9 | **Automatsko asinhrono izvršavanje ordera** | Spec zahteva simulaciju delimičnog izvršavanja ordera po delovima u randomizovanim vremenskim intervalima baziranim na volumenu hartije, uz kreiranje transakcija za svaki deo. Nije implementirano. |
| 10 | **Notifikacija korisniku pri promeni statusa ordera** | Nakon odobravanja/odbijanja ordera od strane supervizora, korisnik treba biti obavešten. Nije implementirano. |

---

## Sumarni pregled po celinama

| Celina | Implementirano | Nedostaje / Netačno |
|--------|---------------|---------------------|
| **Celina 1** – Upravljanje korisnicima | ~85% | 4 stavke (validacije, session, constraints) |
| **Celina 2** – Osnovno poslovanje | ~90% | 5 stavki (quick pay, menjačnica home, prenos, firma detalji) |
| **Celina 3** – Trgovina na berzi | ~40% | 10 stavki (portfolio, order management, tax tracking, buy/sell dialog, opcije) |

---

## Kritični nedostaci (blokiraju funkcionalnost)

1. **Buy/Sell order dialog** – stub `console.log`, trgovina ne radi uopšte.
2. **Portfolio stranica** – ne postoji, korisnici ne mogu ni videti šta poseduju.
3. **Pregled ordera za supervizore** – supervizori ne mogu odobravati/odbijati ordere.
4. **Porez tracking** – portal potpuno nedostaje.
5. **Kupovina opcija** – nema Buy dugmeta u tabeli opcija.
