import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { CrashService, Crash } from '../crash';
import { PageHeader } from '../page-header/page-header';
import { LabelPipe } from '../label-pipe';
import { CrashDetailPanel } from '../crash-detail-panel/crash-detail-panel';

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

  skeletonRows = Array.from({ length: 10 }, (_, i) => i);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.crashService.getAll().subscribe({
      next: (data) => {
        this.crashes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  select(crash: Crash) {
    this.selectedId.set(crash.id);
  }
}
