import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * PR_31 Task 6: LucideIconComponent
 *
 * Lagani inline SVG ikonografski wrapper inspirisan Lucide bibliotekom.
 * Drzimo ikone u mapi kao raw SVG path-ove da izbegnemo dodatni package + da
 * boja/velicina prati `currentColor` i `[size]` prop. Sve ikone potrebne za
 * NavManifest (Task 4) + Topbar/CommandPalette (Task 7+8) su pokrivene.
 *
 * Koristi se kao `<lucide-icon name="home" [size]="16"></lucide-icon>`.
 */
const ICONS: Record<string, string> = {
  home:        '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>',
  wallet:      '<path d="M19 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M3 9V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/><circle cx="16" cy="13" r="1.5"/>',
  send:        '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  creditcard:  '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  piggybank:   '<path d="M19 5a2 2 0 0 1 2 2v3a3 3 0 0 1-1 2v5h-3v-3a8 8 0 0 1-4 1 8 8 0 0 1-4-1v3H6v-5a3 3 0 0 1-1-2V7a2 2 0 0 1 2-2"/><circle cx="16" cy="11" r="1"/>',
  trendingup:  '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  briefcase:   '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  handshake:   '<path d="M11 17l2 2a1 1 0 1 0 3-3"/><path d="M14 14l2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a3 3 0 0 1-4.24 0l-2.62-2.62a1 1 0 0 0-1.41 1.41l4.5 4.5"/>',
  building:    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 8h.01M14 8h.01M9 13h.01M14 13h.01M9 18h6"/>',
  users:       '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  shieldcheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  receipt:     '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2H4z"/><path d="M8 7h8M8 11h8M8 15h6"/>',
  gauge:       '<path d="M14.31 8l5.74 9.94"/><path d="M9.69 8h11.48"/><path d="M7.38 12l5.74-9.94"/><path d="M9.69 16L3.95 6.06"/><path d="M14.31 16H2.83"/><path d="M16.62 12l-5.74 9.94"/><circle cx="12" cy="12" r="10"/>',
  search:      '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  menu:        '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  x:           '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  sun:         '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  moon:        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  monitor:     '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  bell:        '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  chevrondown: '<polyline points="6 9 12 15 18 9"/>',
  /* Empty / error state default ikone za StateComponent (zamenjuju emoji
   * sentineli). Caller-i jos uvek mogu da prosledjuju emoji string preko
   * `icon` Input-a — vidi `StateComponent.isLucide()`. */
  inbox:         '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  alerttriangle: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
};

@Component({
  selector: 'lucide-icon',
  standalone: true,
  imports: [CommonModule],
  template: `<svg viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="svg" [attr.aria-hidden]="!label" [attr.aria-label]="label || null"></svg>`,
})
export class LucideIconComponent {
  /**
   * `DomSanitizer.bypassSecurityTrustHtml` je potreban jer SVG child elementi
   * (`<path>`, `<polyline>`, `<line>`, `<circle>`, `<rect>`) nisu na default
   * sanitization safelist-i — bez ovoga Angular ih brise i ikona je prazan SVG.
   * Bezbedno: source je hardkodirana staticka mapa, nije user input.
   */
  @Input() set name(n: string) {
    const raw = ICONS[n] ?? '';
    this.svg = raw ? this.sanitizer.bypassSecurityTrustHtml(raw) : '';
  }
  @Input() size: number | string = 18;
  @Input() label = '';
  svg: SafeHtml | string = '';

  constructor(private sanitizer: DomSanitizer) {}
}
