/**
 * PR_11 C11.11: OTC vizualizacija odstupanja po spec-u Celina 4.txt:
 *   - zelena: ±5%
 *   - zuta:   ±5–20%
 *   - crvena: >±20%
 *
 * PR_31 T27: tailwind utility text-green/yellow/red literali zamenjeni
 * design tokenima `z-diff-low|mid|high` (CSS vars sa dark-mode override).
 *
 * Pretpostavka: market price kao referenca; OTC offer-ova `pricePerStock` se uporedjuje sa njim.
 */
export type DeviationLevel = 'GREEN' | 'YELLOW' | 'RED';

export function deviationLevel(offerPrice: number, marketPrice: number): DeviationLevel {
  if (marketPrice <= 0) return 'YELLOW';
  const pct = Math.abs((offerPrice - marketPrice) / marketPrice) * 100;
  if (pct <= 5) return 'GREEN';
  if (pct <= 20) return 'YELLOW';
  return 'RED';
}

export function deviationColorClass(level: DeviationLevel): string {
  switch (level) {
    case 'GREEN':  return 'z-diff-low';
    case 'YELLOW': return 'z-diff-mid';
    case 'RED':    return 'z-diff-high';
  }
}

export function deviationLabel(offerPrice: number, marketPrice: number): string {
  if (marketPrice <= 0) return '—';
  const pct = ((offerPrice - marketPrice) / marketPrice) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}
