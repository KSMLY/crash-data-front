import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PageHeader } from '../page-header/page-header';
import { TrendChart } from '../trend-chart/trend-chart';
import { CrashService, Overview as OverviewData } from '../crash';

interface Kpi {
  label: string;
  icon: string;
  current: number;
  previous: number;
}

@Component({
  selector: 'app-overview',
  imports: [DecimalPipe, PageHeader, TrendChart],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview implements OnInit {
  private crashService = inject(CrashService);

  overview = signal<OverviewData | null>(null);
  loading = signal(true);
  error = signal(false);

  kpis = computed<Kpi[]>(() => {
    const o = this.overview();
    if (!o) return [];
    return [
      { label: 'Total crashes', icon: 'car_crash', ...o.total },
      { label: 'Fatal crashes', icon: 'dangerous', ...o.fatal },
      { label: 'Serious injury crashes', icon: 'personal_injury', ...o.serious },
    ];
  });

  skeletonRows = Array.from({ length: 6 }, (_, i) => i);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.crashService.getOverview().subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  // Change vs the previous window as a percentage; null when there is nothing to compare against
  delta(current: number, previous: number): number | null {
    return previous === 0 ? null : ((current - previous) / previous) * 100;
  }
}
