import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface District {
  id: number;
  governorateId: number;
  nameEn: string;
  nameAr: string;
}

export interface Municipality {
  id: number;
  districtId: number;
  nameEn: string;
  nameAr: string;
}

export interface Crash {
  id: number;
  policeRef: string;
  refYear: number;
  crashDate: string;
  crashTime: string;
  district: District;
  municipality: Municipality | null;
  latitude: number;
  longitude: number;
  crashType: string;
  impactType: string;
  weather: string;
  light: string;
  severity: string;
  roadwayType: string;
  functionalClass: string;
  speedLimitKmh: number;
  obstaclePresent: string;
  surfaceCondition: string;
  junctionType: string;
  curve: string;
  grade: string;
  trafficControls: string[];
}

export interface Vehicle {
  id: number;
  vehicleNumber: number;
  vehicleType: string;
  make: string | null;
  model: string | null;
  modelYear: number | null;
  manoeuvre: string;
}

export interface Person {
  id: number;
  personNumber: number;
  roadUserType: string;
  injurySeverity: string;
}

// GET /crashes/{id}: the list row plus its vehicles and people.
export interface CrashDetail extends Crash {
  vehicles: Vehicle[];
  persons: Person[];
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
}
// Query parameters of GET /crashes. Empty strings are dropped before the request.
export interface CrashSearch {
  q?: string;
  severity?: string;
  crashType?: string;
  districtId?: number | string;
  municipalityId?: number | string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface Counts {
  current: number;
  previous: number;
}

export interface DistrictCounts {
  district: District;
  total: number;
  fatal: number;
  serious: number;
  previousTotal: number;
}

export interface Overview {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  total: Counts;
  fatal: Counts;
  serious: Counts;
  topDistricts: DistrictCounts[];
}

export type Granularity = 'DAILY' | 'WEEKLY' | 'MONTHLY';

// One bucket of GET /overview/trend; periodStart is the first day of the bucket.
export interface TrendPoint {
  periodStart: string;
  total: number;
  fatal: number;
  serious: number;
  slight: number;
}

@Injectable({ providedIn: 'root' })
export class CrashService {
  private http = inject(HttpClient);

  search(params: CrashSearch): Observable<Page<Crash>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value);
      }
    }
    return this.http.get<Page<Crash>>('/api/crashes', { params: httpParams });
  }

  getById(id: number): Observable<CrashDetail> {
    return this.http.get<CrashDetail>(`/api/crashes/${id}`);
  }

  getDistricts(): Observable<District[]> {
    return this.http.get<District[]>('/api/districts');
  }

  getMunicipalities(districtId: number | string): Observable<Municipality[]> {
    return this.http.get<Municipality[]>('/api/municipalities', { params: { districtId } });
  }

  // GET /codes returns every enum keyed by field name; only crashType is needed here
  getCrashTypes(): Observable<string[]> {
    return this.http
      .get<Record<string, string[]>>('/api/codes')
      .pipe(map((codes) => codes['crashType']));
  }

  getOverview(): Observable<Overview> {
    return this.http.get<Overview>('/api/overview');
  }

  getTrend(granularity: Granularity): Observable<TrendPoint[]> {
    return this.http.get<TrendPoint[]>('/api/overview/trend', { params: { granularity } });
  }
}
