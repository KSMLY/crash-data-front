import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { PinMap, round6 } from './pin-map';

describe('PinMap', () => {
  let component: PinMap;
  let fixture: ComponentFixture<PinMap>;
  const latitude = new FormControl<number | null>(33.9);
  const longitude = new FormControl<number | null>(35.5);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PinMap] }).compileComponents();
    fixture = TestBed.createComponent(PinMap);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('latitude', latitude);
    fixture.componentRef.setInput('longitude', longitude);
    await fixture.whenStable();
  });

  it('removes the pin by clearing both coordinates', () => {
    expect(component.hasPin()).toBe(true);
    component.clear();
    expect(latitude.value).toBeNull();
    expect(longitude.value).toBeNull();
    expect(component.hasPin()).toBe(false);
  });
});

describe('round6', () => {
  it('keeps six decimals', () => {
    expect(round6(33.123456789)).toBe(33.123457);
  });
});
