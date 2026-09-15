import { TestBed } from '@angular/core/testing';

import { Crash } from './crash';

describe('Crash', () => {
  let service: Crash;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Crash);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
