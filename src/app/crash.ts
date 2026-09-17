import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Crash {
  id: number;
  policeRef: string;
  refYear: number;
  crashDate: string;
  crashTime: string;
  district: { id: number; governorateId: number; nameEn: string; nameAr: string };
  municipality: { id: number; districtId: number; nameEn: string; nameAr: string } | null;
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

@Injectable({ providedIn: 'root' })
export class CrashService {
  private http = inject(HttpClient);

  getAll(): Observable<Crash[]> {
    return this.http.get<Crash[]>('/api/crashes');
  }
}
