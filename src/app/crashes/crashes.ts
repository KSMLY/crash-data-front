import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { CrashService, Crash, CrashSearch, District, Municipality } from '../crash';
import { PageHeader } from '../page-header/page-header';
import { LabelPipe } from '../label-pipe';
import { CrashDetailPanel } from '../crash-detail-panel/crash-detail-panel';

type Period = 'last30' | 'last90' | 'year' | 'all';

@Component({
  selector: 'app-crashes',
  imports: [DatePipe, SlicePipe, LabelPipe, PageHeader, CrashDetailPanel],
  templateUrl: './crashes.html',
  styleUrl: './crashes.css',
})
export class Crashes implements OnInit {
  private crashService = inject(CrashService);

  crashes = signal<Crash[]>([]);
  loading = signal(true);
  error = signal(false);
  selectedId = signal<number | null>(null);
  exporting = signal(false);
  exportError = signal(false);

  // --- filters ---
  q = signal('');
  period = signal<Period>('last30');
  severity = signal('');
  districtId = signal('');
  municipalityId = signal('');
  crashType = signal('');
  moreOpen = signal(false);

  periods: { value: Period; label: string }[] = [
    { value: 'last30', label: 'Last 30 days' },
    { value: 'last90', label: 'Last 90 days' },
    { value: 'year', label: 'This year' },
    { value: 'all', label: 'All time' },
  ];
  severities = ['FATAL', 'SERIOUS', 'SLIGHT'];
  districts = signal<District[]>([]);
  municipalities = signal<Municipality[]>([]);
  crashTypes = signal<string[]>([]);

  // "Clear all" shows once anything differs from the defaults
  hasFilters = computed(
    () =>
      this.q() !== '' ||
      this.period() !== 'last30' ||
      this.severity() !== '' ||
      this.districtId() !== '' ||
      this.municipalityId() !== '' ||
      this.crashType() !== '',
  );

  // --- paging ---
  page = signal(0);
  total = signal(0);
  readonly size = 20;
  from = computed(() => (this.total() === 0 ? 0 : this.page() * this.size + 1));
  to = computed(() => Math.min((this.page() + 1) * this.size, this.total()));
  lastPage = computed(() => Math.max(0, Math.ceil(this.total() / this.size) - 1));
  // Up to five page numbers centred on the current one
  pageNumbers = computed(() => {
    const start = Math.max(0, Math.min(this.page() - 2, this.lastPage() - 4));
    const end = Math.min(this.lastPage(), start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  skeletonRows = Array.from({ length: 10 }, (_, i) => i);

  private searchTimer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.load();
    this.crashService.getDistricts().subscribe((d) => this.districts.set(d));
    this.crashService.getCrashTypes().subscribe((t) => this.crashTypes.set(t));
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.crashService
      .search({ ...this.filters(), page: this.page(), size: this.size })
      .subscribe({
        next: (data) => {
          this.crashes.set(data.content);
          this.total.set(data.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  // Any filter change restarts from the first page; only paging keeps the position.
  // Typing waits for a pause so each keystroke is not a request
  setQuery(q: string) {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.apply(() => this.q.set(q)), 300);
  }

  setPeriod(period: string) {
    this.apply(() => this.period.set(period as Period));
  }

  setSeverity(severity: string) {
    this.apply(() => this.severity.set(severity));
  }

  setDistrict(districtId: string) {
    this.apply(() => {
      this.districtId.set(districtId);
      this.municipalityId.set('');
    });
    this.municipalities.set([]);
    if (districtId !== '') {
      this.crashService.getMunicipalities(districtId).subscribe((m) => this.municipalities.set(m));
    }
  }

  setMunicipality(municipalityId: string) {
    this.apply(() => this.municipalityId.set(municipalityId));
  }

  setCrashType(crashType: string) {
    this.apply(() => this.crashType.set(crashType));
  }

  clearAll() {
    this.apply(() => {
      this.q.set('');
      this.period.set('last30');
      this.severity.set('');
      this.districtId.set('');
      this.municipalityId.set('');
      this.crashType.set('');
    });
    this.municipalities.set([]);
  }

  goTo(page: number) {
    if (page < 0 || page > this.lastPage() || page === this.page()) return;
    this.page.set(page);
    this.load();
  }

  select(crash: Crash) {
    this.selectedId.set(crash.id);
  }

  // The file comes back as a Blob; a temporary object URL on a hidden link is how a
  // browser is told to save it. The URL is released straight after the click
  exportCsv() {
    this.exporting.set(true);
    this.exportError.set(false);
    this.crashService.export(this.filters()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `crashes-${isoDaysAgo(new Date(), 0)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => {
        this.exportError.set(true);
        this.exporting.set(false);
      },
    });
  }

  // Shared by the table and the export so both always ask for the same rows
  private filters(): CrashSearch {
    return {
      q: this.q(),
      severity: this.severity(),
      crashType: this.crashType(),
      districtId: this.districtId(),
      municipalityId: this.municipalityId(),
      from: this.fromDate(),
    };
  }

  private apply(change: () => void) {
    change();
    this.page.set(0);
    this.load();
  }

  // Start of the selected period as YYYY-MM-DD, or undefined for "all time"
  private fromDate(): string | undefined {
    const today = new Date();
    switch (this.period()) {
      case 'last30':
        return isoDaysAgo(today, 30);
      case 'last90':
        return isoDaysAgo(today, 90);
      case 'year':
        return today.getFullYear() + '-01-01';
      case 'all':
        return undefined;
    }
  }
}

// Local-time date; toISOString() would shift the day near midnight
function isoDaysAgo(today: Date, days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}
