import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CrashService } from './crash';

describe('CrashService', () => {
  let service: CrashService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CrashService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
