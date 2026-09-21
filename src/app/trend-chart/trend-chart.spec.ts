import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { tickStep, TrendChart } from './trend-chart';
import { TrendPoint } from '../crash';

function point(periodStart: string, total: number): TrendPoint {
  return { periodStart, total, fatal: 0, serious: 0, slight: total };
}

describe('tickStep', () => {
  it('picks a round step that fits the maximum in at most five steps', () => {
    expect(tickStep(0)).toBe(1);
    expect(tickStep(4)).toBe(1);
    expect(tickStep(6)).toBe(2);
    expect(tickStep(43)).toBe(10);
    expect(tickStep(296)).toBe(100);
    expect(tickStep(1215)).toBe(500);
  });
});

describe('TrendChart', () => {
  let component: TrendChart;
  let fixture: ComponentFixture<TrendChart>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendChart],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TrendChart);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('loads the daily trend on init', () => {
    const req = http.expectOne((r) => r.url === '/api/overview/trend');
    expect(req.request.params.get('granularity')).toBe('DAILY');
    req.flush([point('2026-09-01', 3)]);
    expect(component.loading()).toBe(false);
    expect(component.chart().bars.length).toBe(1);
  });

  it('reloads when the granularity changes', () => {
    http.expectOne((r) => r.url === '/api/overview/trend').flush([]);
    component.setGranularity('WEEKLY');
    const req = http.expectOne((r) => r.url === '/api/overview/trend');
    expect(req.request.params.get('granularity')).toBe('WEEKLY');
    req.flush([]);
  });

  it('scales bars to a round axis maximum', () => {
    http
      .expectOne((r) => r.url === '/api/overview/trend')
      .flush([point('2026-09-01', 43), point('2026-09-02', 0)]);
    const { bars, yTicks } = component.chart();
    expect(yTicks.map((t) => t.value)).toEqual([0, 10, 20, 30, 40, 50]);
    // tallest bar fills 43/50 of the plot height
    expect(bars[0].h).toBeCloseTo((43 / 50) * (202 - 14));
    expect(bars[1].h).toBe(0);
  });

  it('keeps an axis when every bucket is empty', () => {
    http.expectOne((r) => r.url === '/api/overview/trend').flush([point('2026-09-01', 0)]);
    expect(component.chart().yTicks.map((t) => t.value)).toEqual([0, 1, 2, 3, 4]);
  });

  it('labels every fifth daily bar and every other weekly bar', () => {
    const days = Array.from({ length: 30 }, (_, i) => point(`2026-09-${i + 1}`, 1));
    http.expectOne((r) => r.url === '/api/overview/trend').flush(days);
    expect(component.chart().xTicks.length).toBe(6);

    component.setGranularity('WEEKLY');
    const weeks = Array.from({ length: 12 }, (_, i) => point(`2026-07-${i + 1}`, 1));
    http.expectOne((r) => r.url === '/api/overview/trend').flush(weeks);
    expect(component.chart().xTicks.length).toBe(6);
  });

  it('shows the error state and retries', () => {
    http.expectOne((r) => r.url === '/api/overview/trend').error(new ProgressEvent('error'));
    expect(component.error()).toBe(true);
    component.load();
    http.expectOne((r) => r.url === '/api/overview/trend').flush([]);
    expect(component.error()).toBe(false);
  });

  it('builds the tooltip for the hovered bar', () => {
    http
      .expectOne((r) => r.url === '/api/overview/trend')
      .flush([{ periodStart: '2026-09-01', total: 5, fatal: 1, serious: 2, slight: 2 }]);
    expect(component.tooltip()).toBeNull();
    component.hovered.set(0);
    expect(component.tooltip()?.total).toBe(5);
    expect(component.tooltip()?.breakdown.map((r) => r.value)).toEqual([1, 2, 2]);
  });
});
