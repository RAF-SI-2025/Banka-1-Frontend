import { ApexOptions } from 'ng-apexcharts';

export type EffectiveTheme = 'light' | 'dark';

export function readCssVar(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function buildPriceChartTheme(
  effective: EffectiveTheme,
  opts?: { up?: string; down?: string }
): Partial<ApexOptions> {
  const fg = readCssVar('--foreground') || (effective === 'dark' ? '#e7f0ea' : '#0a1410');
  const muted = readCssVar('--muted-foreground') || (effective === 'dark' ? '#86efac' : '#5e6b62');
  const border = readCssVar('--border') || (effective === 'dark' ? 'rgba(74,222,128,0.12)' : '#dbe2dd');
  const up = opts?.up ?? (readCssVar('--emerald-500') || '#22c55e');
  const down = opts?.down ?? (readCssVar('--destructive') || (effective === 'dark' ? '#f87171' : '#dc2626'));
  const gold = readCssVar('--gold-500') || '#d4a72c';

  return {
    chart: {
      type: 'area',
      foreColor: muted,
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: true, speed: 400 },
      zoom: { enabled: false },
    },
    theme: {
      mode: effective,
      palette: 'palette1',
      monochrome: { enabled: false },
    },
    colors: [up, down, gold],
    grid: {
      borderColor: border,
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: effective === 'dark' ? 0.35 : 0.25,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    tooltip: {
      theme: effective,
      x: { format: 'dd MMM yyyy HH:mm' },
      style: { fontFamily: "'Geist', sans-serif", fontSize: '12px' },
    },
    markers: {
      size: 0,
      hover: { size: 5, sizeOffset: 2 },
      colors: [gold],
      strokeColors: gold,
    },
    xaxis: {
      axisBorder: { color: border, show: true },
      axisTicks: { color: border, show: true },
      labels: { style: { colors: muted, fontFamily: "'Geist', sans-serif" } },
    },
    yaxis: {
      labels: { style: { colors: muted, fontFamily: "'Geist Mono', monospace" } },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
  };
}
