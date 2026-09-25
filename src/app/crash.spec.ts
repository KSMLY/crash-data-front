import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CrashService } from './crash';

describe('CrashService', () => {
  let service: CrashService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CrashService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('exports as a blob with only the filters that are set', () => {
    const csv = new Blob(['police_ref\r\n'], { type: 'text/csv' });
    let received: Blob | undefined;

    service.export({ q: 'PR', severity: 'FATAL', districtId: '', from: undefined }).subscribe((b) => (received = b));

    const req = http.expectOne((r) => r.url === '/api/crashes/export');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.params.keys()).toEqual(['q', 'severity']);
    expect(req.request.params.get('severity')).toBe('FATAL');
    req.flush(csv);

    expect(received).toBe(csv);
  });
});
