import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrashList } from './crash-list';

describe('CrashList', () => {
  let component: CrashList;
  let fixture: ComponentFixture<CrashList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrashList],
    }).compileComponents();

    fixture = TestBed.createComponent(CrashList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
