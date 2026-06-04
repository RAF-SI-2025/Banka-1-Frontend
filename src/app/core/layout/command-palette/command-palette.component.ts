import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { filterNavByPermissions, NAV_MANIFEST, NavItem } from '../nav-manifest';

const COMMAND_PALETTE_EVENT = 'banka:open-command-palette';
const INITIAL_RESULT_COUNT = 6;
const MAX_SEARCH_RESULTS = 8;

/**
 * PR_31 Task 8: CommandPaletteComponent
 *
 * Navigation-only command palette (Cmd+K / Ctrl+K). Otvara se preko globalnog
 * `banka:open-command-palette` event-a koji dispatch-uje TopbarComponent.
 * Filtrira `NAV_MANIFEST` po permisijama trenutno ulogovanog korisnika, pa
 * nudi fuzzy search po `label`-ima (score: exact 100 > startsWith 50 >
 * includes 25 > characters-in-order 10). Enter navigira na selektovani item,
 * ArrowUp/Down menja izbor, Escape zatvara modal.
 *
 * Bez backend poziva — sva data dolazi iz statickog manifest-a.
 */
@Component({
  selector: 'app-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss'],
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  open = false;
  query = '';
  results: NavItem[] = [];
  selectedIndex = 0;
  private allItems: NavItem[] = [];
  private readonly listener = (): void => this.openModal();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    const user = this.auth.getLoggedUser();
    const perms = user?.permissions ?? [];
    const role = (user as any)?.role as string | undefined;
    const capabilities = role ? [...perms, role] : perms;
    this.allItems = filterNavByPermissions(NAV_MANIFEST, capabilities).flatMap(
      (g) => g.items,
    );
    this.results = this.allItems.slice(0, INITIAL_RESULT_COUNT);
    window.addEventListener(COMMAND_PALETTE_EVENT, this.listener);
  }

  ngOnDestroy(): void {
    window.removeEventListener(COMMAND_PALETTE_EVENT, this.listener);
  }

  openModal(): void {
    this.open = true;
    this.query = '';
    this.results = this.allItems.slice(0, INITIAL_RESULT_COUNT);
    this.selectedIndex = 0;
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 0);
  }

  closeModal(): void {
    this.open = false;
  }

  onInput(): void {
    const q = this.query.trim().toLowerCase();
    if (!q) {
      this.results = this.allItems.slice(0, INITIAL_RESULT_COUNT);
      this.selectedIndex = 0;
      return;
    }
    this.results = this.allItems
      .map((item) => ({ item, score: this.score(q, item) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SEARCH_RESULTS)
      .map((x) => x.item);
    this.selectedIndex = 0;
  }

  select(item: NavItem): void {
    this.router.navigate([item.route]);
    this.closeModal();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this.open) return;
    if (e.key === 'Escape') {
      this.closeModal();
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowDown') {
      this.selectedIndex = Math.min(
        this.results.length - 1,
        this.selectedIndex + 1,
      );
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowUp') {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter' && this.results[this.selectedIndex]) {
      this.select(this.results[this.selectedIndex]);
      e.preventDefault();
      return;
    }
  }

  /**
   * Fuzzy score: exact match (100) > startsWith (50) > substring (25) >
   * characters-in-order (10) > miss (0). Sve poredjenje na lowercase.
   */
  private score(q: string, item: NavItem): number {
    const label = item.label.toLowerCase();
    if (label === q) return 100;
    if (label.startsWith(q)) return 50;
    if (label.includes(q)) return 25;
    let qi = 0;
    for (let i = 0; i < label.length && qi < q.length; i++) {
      if (label[i] === q[qi]) qi++;
    }
    return qi === q.length ? 10 : 0;
  }
}
