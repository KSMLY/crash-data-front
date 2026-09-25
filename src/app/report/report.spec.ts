import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';

import { Report, bothOrNeither, notInFuture } from './report';

describe('Report', () => {
  let component: Report;
  let fixture: ComponentFixture<Report>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Report],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Report);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stays on step 1 until the required fields are filled', () => {
    component.next();
    expect(component.step()).toBe(0);
    expect(component.crash.controls.policeRef.touched).toBe(true);

    component.crash.patchValue({ policeRef: 'BEY-1', districtId: 3 });
    component.next();
    expect(component.step()).toBe(1);
    expect(component.reached()).toBe(1);
  });

  it('only jumps back to steps already reached', () => {
    component.goTo(2);
    expect(component.step()).toBe(0);
  });

  it('clears the municipality and reloads its options when the district changes', () => {
    const { districtId, municipalityId } = component.crash.controls;
    districtId.setValue(3);
    http.expectOne((r) => r.url === '/api/municipalities').flush([{ id: 9, districtId: 3 }]);
    municipalityId.setValue(9);

    districtId.setValue(4);
    expect(municipalityId.value).toBeNull();
    expect(component.municipalities()).toEqual([]);
  });

  it('takes the reference year from the crash date until edited', () => {
    const { crashDate, refYear } = component.crash.controls;
    crashDate.setValue('2024-05-01');
    expect(refYear.value).toBe(2024);

    refYear.markAsDirty();
    refYear.setValue(2023);
    crashDate.setValue('2025-01-01');
    expect(refYear.value).toBe(2023);
  });

  it('adds and removes traffic controls', () => {
    component.toggleTrafficControl('STOP_SIGN', true);
    component.toggleTrafficControl('GIVE_WAY', true);
    component.toggleTrafficControl('STOP_SIGN', false);
    expect(component.road.controls.trafficControls.value).toEqual(['GIVE_WAY']);
  });
});

describe('notInFuture', () => {
  it('rejects tomorrow and accepts today or empty', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    expect(notInFuture(new FormControl(iso(tomorrow)))).toEqual({ future: true });
    expect(notInFuture(new FormControl(iso(new Date())))).toBeNull();
    expect(notInFuture(new FormControl(''))).toBeNull();
  });
});

describe('bothOrNeither', () => {
  const group = (lat: number | null, lng: number | null) =>
    new FormGroup({ lat: new FormControl(lat), lng: new FormControl(lng) });
  const check = bothOrNeither('lat', 'lng');

  it('accepts both or neither, rejects one alone', () => {
    expect(check(group(33.9, 35.5))).toBeNull();
    expect(check(group(null, null))).toBeNull();
    expect(check(group(33.9, null))).toEqual({ halfCoordinate: true });
  });
});
