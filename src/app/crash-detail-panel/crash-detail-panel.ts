import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { CrashService, CrashDetail } from '../crash';
import { LabelPipe } from '../label-pipe';

@Component({
  selector: 'app-crash-detail-panel',
  imports: [DatePipe, SlicePipe, LabelPipe],
  templateUrl: './crash-detail-panel.html',
  styleUrl: './crash-detail-panel.css',
})
export class CrashDetailPanel {
  private crashService = inject(CrashService);

  /** Which crash to show; null shows the "nothing selected" state. */
  crashId = input<number | null>(null);
  closed = output<void>();

  crash = signal<CrashDetail | null>(null);
  loading = signal(false);
  error = signal(false);

  // Fetch again whenever the parent hands us a different id.
  private fetchOnIdChange = effect(() => {
    const id = this.crashId();
    if (id === null) {
      this.crash.set(null);
      return;
    }
    this.load(id);
  });

  counts = computed(() => {
    const c = this.crash();
    if (!c) return [];
    const killed = c.persons.filter((p) => p.injurySeverity === 'FATAL').length;
    const injured = c.persons.filter(
      (p) => p.injurySeverity === 'SERIOUS' || p.injurySeverity === 'SLIGHT',
    ).length;
    return [
      { label: 'Killed', value: killed, kind: 'killed' },
      { label: 'Injured', value: injured, kind: 'injured' },
      { label: 'People involved', value: c.persons.length, kind: 'plain' },
      { label: 'Vehicles', value: c.vehicles.length, kind: 'plain' },
    ];
  });

  load(id: number) {
    this.loading.set(true);
    this.error.set(false);
    this.crashService.getById(id).subscribe({
      next: (data) => {
        this.crash.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  retry() {
    const id = this.crashId();
    if (id !== null) this.load(id);
  }
}
