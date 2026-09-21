import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CrashService, Granularity, TrendPoint } from '../crash';
import { LabelPipe } from '../label-pipe';

// Plot area inside the 660 × 230 viewBox; the margins leave room for the axis labels.
export const PLOT = { width: 660, height: 230, x0: 36, x1: 650, y0: 14, y1: 202 } as const;

interface Bar {
  point: TrendPoint;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  // Full-height hit area so the tooltip opens anywhere in the bar's slot, not just on the bar.
  slotX: number;
  slotW: number;
}

interface YTick {
  y: number;
  value: number;
}

interface XTick {
  x: number;
  date: string;
}

interface Chart {
  bars: Bar[];
  yTicks: YTick[];
  xTicks: XTick[];
}

// Smallest of 1, 2, 5, 10, 20, 50… that covers the tallest bar in at most five steps,
// so the axis labels are always round numbers.
export function tickStep(max: number): number {
  for (let magnitude = 1; ; magnitude *= 10) {
    for (const base of [1, 2, 5]) {
      const step = base * magnitude;
      if (max <= step * 5) return step;
    }
  }
}

@Component({
  selector: 'app-trend-chart',
  imports: [DatePipe, DecimalPipe, LabelPipe],
  templateUrl: './trend-chart.html',
  styleUrl: './trend-chart.css',
})
export class TrendChart implements OnInit {
  private crashService = inject(CrashService);

  readonly plot = PLOT;
  readonly granularities: Granularity[] = ['DAILY', 'WEEKLY', 'MONTHLY'];

  granularity = signal<Granularity>('DAILY');
  points = signal<TrendPoint[]>([]);
  loading = signal(true);
  error = signal(false);
  hovered = signal<number | null>(null);

  // Axis labels are short; the tooltip title spells the period out.
  axisDateFormat = computed(() => (this.granularity() === 'MONTHLY' ? 'MMM' : 'd MMM'));
  tooltipDateFormat = computed(() => {
    switch (this.granularity()) {
      case 'DAILY':
        return 'EEE d MMM yyyy';
      case 'WEEKLY':
        return "'Week of' d MMM yyyy";
      case 'MONTHLY':
        return 'MMMM yyyy';
    }
  });

  chart = computed<Chart>(() => {
    const points = this.points();
    const n = points.length;
    const max = Math.max(0, ...points.map((p) => p.total));
    const step = tickStep(max);
    // An empty window still draws a 0–4 axis instead of collapsing to a single line.
    const top = max === 0 ? 4 : Math.ceil(max / step) * step;

    const plotWidth = PLOT.x1 - PLOT.x0;
    const plotHeight = PLOT.y1 - PLOT.y0;
    const slotW = plotWidth / n;
    const barW = Math.min(slotW * 0.62, 26);

    const bars = points.map((point, i) => {
      const cx = PLOT.x0 + slotW * (i + 0.5);
      const h = (point.total / top) * plotHeight;
      return {
        point,
        x: cx - barW / 2,
        y: PLOT.y1 - h,
        w: barW,
        h,
        cx,
        slotX: PLOT.x0 + slotW * i,
        slotW,
      };
    });

    const yTicks: YTick[] = [];
    for (let value = 0; value <= top; value += step) {
      yTicks.push({ value, y: PLOT.y1 - (value / top) * plotHeight });
    }

    // 30 daily labels don't fit, so label every fifth day; weekly/monthly label every other bar.
    const every = n > 20 ? 5 : 2;
    const xTicks = bars
      .filter((_, i) => i % every === 0)
      .map((b) => ({ x: b.cx, date: b.point.periodStart }));

    return { bars, yTicks, xTicks };
  });

  tooltip = computed(() => {
    const i = this.hovered();
    if (i === null) return null;
    const bar = this.chart().bars[i];
    const p = bar.point;
    return {
      date: p.periodStart,
      // Keep the tooltip inside the card: it is centred on the bar, so clamp by half its width.
      leftPct: Math.min(Math.max((bar.cx / PLOT.width) * 100, 22), 78),
      rows: [
        { label: 'Total', value: p.total },
        { label: 'Fatal', value: p.fatal },
        { label: 'Serious injury', value: p.serious },
        { label: 'Slight injury', value: p.slight },
      ],
    };
  });

  ngOnInit() {
    this.load();
  }

  setGranularity(granularity: Granularity) {
    if (granularity === this.granularity()) return;
    this.granularity.set(granularity);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.hovered.set(null);
    this.crashService.getTrend(this.granularity()).subscribe({
      next: (points) => {
        this.points.set(points);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
