import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CrashDetailPanel } from './crash-detail-panel';

describe('CrashDetailPanel', () => {
  let fixture: ComponentFixture<CrashDetailPanel>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrashDetailPanel],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(CrashDetailPanel);
    http = TestBed.inject(HttpTestingController);
  });

  it('shows the empty state when nothing is selected', async () => {
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No crash selected');
    http.expectNone('/api/crashes/1');
  });

  it('fetches the crash and counts people by injury', async () => {
    fixture.componentRef.setInput('crashId', 1);
    await fixture.whenStable();
    http.expectOne('/api/crashes/1').flush({
      id: 1,
      policeRef: 'PR-1',
      crashDate: '2026-09-10',
      crashTime: '14:30:00',
      district: { nameEn: 'Akkar' },
      municipality: null,
      latitude: 33.1,
      longitude: 35.2,
      crashType: 'PEDESTRIAN',
      severity: 'FATAL',
      vehicles: [{ id: 1 }],
      persons: [
        { injurySeverity: 'FATAL' },
        { injurySeverity: 'SLIGHT' },
        { injurySeverity: 'NO_INJURY' },
      ],
    });
    await fixture.whenStable();

    const counts = fixture.componentInstance.counts().map((c) => c.value);
    expect(counts).toEqual([1, 1, 3, 1]);
    expect(fixture.nativeElement.textContent).toContain('PR-1');
  });
});
