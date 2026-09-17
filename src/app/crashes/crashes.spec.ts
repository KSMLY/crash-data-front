import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Crashes } from './crashes';

describe('Crashes', () => {
  let component: Crashes;
  let fixture: ComponentFixture<Crashes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Crashes],
    }).compileComponents();

    fixture = TestBed.createComponent(Crashes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
