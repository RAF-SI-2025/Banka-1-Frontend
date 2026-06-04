import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Banka-1-Frontend';

  // Ranije je @HostListener('window:beforeunload') brisao authToken/loggedUser/
  // refreshToken pri svakom unload-u. beforeunload se okida i pri obicnom F5
  // refresh-u (ne samo pri zatvaranju tab-a/browsera) — pa je svaki refresh
  // izlogavao korisnika. Ako se trazi auto-logout pri close, koristiti
  // sessionStorage (preserve-uje se kroz refresh, brise se na tab close)
  // umesto localStorage; za sada se oslanjamo na JWT exp i manual logout.
}
