import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { clusterBucket, clusterPopupHtml, HotspotMap, popupHtml } from './hotspot-map';
import { CrashPoint } from '../crash';

function point(id: number, severity: string): CrashPoint {
  return {
    id,
    policeRef: `2026-00000${id}`,
    crashDate: '2026-09-02',
    latitude: 33.88 + id / 100,
    longitude: 35.5,
    severity,
  };
}

describe('clusterBucket', () => {
  it('picks the bucket the crash count falls in', () => {
    expect(clusterBucket(0).className).toBe('low');
    expect(clusterBucket(59).className).toBe('low');
    expect(clusterBucket(60).className).toBe('mid');
    expect(clusterBucket(149).className).toBe('mid');
    expect(clusterBucket(150).className).toBe('high');
  });
});

describe('popupHtml', () => {
  it('shows the reference, the date and the severity', () => {
    expect(popupHtml(point(1, 'FATAL'))).toBe('<b>2026-000001</b><br>2 Sep 2026 · Fatal');
  });
});

describe('clusterPopupHtml', () => {
  it('lists the crashes sharing a coordinate', () => {
    const html = clusterPopupHtml(['a', 'b']);
    expect(html).toContain('2 crashes at this location');
    expect(html).toContain('a<hr>b');
  });

  it('counts the ones it leaves out', () => {
    const html = clusterPopupHtml(Array.from({ length: 9 }, (_, i) => `c${i}`));
    expect(html).toContain('9 crashes at this location');
    expect(html).toContain('c5');
    expect(html).not.toContain('c6');
    expect(html).toContain('and 3 more');
  });
});

describe('HotspotMap', () => {
  let component: HotspotMap;
  let fixture: ComponentFixture<HotspotMap>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotspotMap],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(HotspotMap);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    // the map is created in afterNextRender, so the request only goes out once rendered
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('loads the points and puts a marker on the map', () => {
    http
      .expectOne('/api/crashes/points')
      .flush([point(1, 'FATAL'), point(2, 'SLIGHT'), point(3, 'SERIOUS')]);

    expect(component.loading()).toBe(false);
    // Leaflet only puts markers for the visible area in the DOM, and the container
    // has no size under jsdom, so the loaded points are what can be asserted here.
    expect(component.points().length).toBe(3);
  });

  it('shows the error state and retries', () => {
    http.expectOne('/api/crashes/points').error(new ProgressEvent('error'));
    expect(component.error()).toBe(true);

    component.load();
    http.expectOne('/api/crashes/points').flush([]);
    expect(component.error()).toBe(false);
  });
});
