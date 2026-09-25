import { Component, DestroyRef, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CrashService, Codes, District, Municipality } from '../crash';
import { PageHeader } from '../page-header/page-header';
import { LabelPipe } from '../label-pipe';
import { PinMap } from '../pin-map/pin-map';

// The road step's code dropdowns, in display order. Each key is both the form
// control name and the key of its option list in GET /codes
const ROAD_FIELDS = [
  { key: 'crashType', label: 'Crash type', required: true },
  { key: 'impactType', label: 'Impact type', required: true },
  { key: 'roadwayType', label: 'Roadway type', required: true },
  { key: 'functionalClass', label: 'Functional class', required: false },
  { key: 'junctionType', label: 'Junction', required: true },
  { key: 'curve', label: 'Curve', required: true },
  { key: 'grade', label: 'Grade', required: true },
  { key: 'surfaceCondition', label: 'Surface', required: true },
  { key: 'weather', label: 'Weather', required: true },
  { key: 'light', label: 'Light', required: true },
  { key: 'obstaclePresent', label: 'Obstacle present', required: true },
];

// 999 is the schema's "unknown" speed limit
const SPEED_LIMITS = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
const UNKNOWN_SPEED = 999;

// Rough bounding box of Lebanon; catches swapped or mistyped coordinates
const LAT_RANGE = [33.0, 34.7];
const LNG_RANGE = [35.0, 36.7];

@Component({
  selector: 'app-report',
  imports: [ReactiveFormsModule, RouterLink, PageHeader, LabelPipe, PinMap],
  templateUrl: './report.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './report.css',
})
export class Report implements OnInit {
  private crashService = inject(CrashService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder).nonNullable;

  readonly steps = ['Crash', 'Road & conditions', 'Vehicles', 'People', 'Review'];
  readonly roadFields = ROAD_FIELDS;
  readonly speedLimits = SPEED_LIMITS;
  readonly unknownSpeed = UNKNOWN_SPEED;
  readonly latRange = LAT_RANGE;
  readonly lngRange = LNG_RANGE;
  readonly thisYear = new Date().getFullYear();

  step = signal(0);
  // Furthest step reached; the indicator can jump back to any of them
  reached = signal(0);

  codes = signal<Codes | null>(null);
  codesError = signal(false);
  districts = signal<District[]>([]);
  municipalities = signal<Municipality[]>([]);

  crash = this.fb.group(
    {
      policeRef: ['', [Validators.required, Validators.maxLength(30)]],
      refYear: [this.thisYear, [Validators.required, Validators.min(1990), Validators.max(this.thisYear)]],
      crashDate: ['', notInFuture],
      crashTime: [''],
      districtId: this.fb.control<number | null>(null, Validators.required),
      municipalityId: this.fb.control<number | null>({ value: null, disabled: true }),
      latitude: this.fb.control<number | null>(null, [Validators.min(LAT_RANGE[0]), Validators.max(LAT_RANGE[1])]),
      longitude: this.fb.control<number | null>(null, [Validators.min(LNG_RANGE[0]), Validators.max(LNG_RANGE[1])]),
    },
    { validators: bothOrNeither('latitude', 'longitude') },
  );

  road = this.fb.group({
    crashType: ['', Validators.required],
    impactType: ['', Validators.required],
    roadwayType: ['', Validators.required],
    functionalClass: [''],
    junctionType: ['', Validators.required],
    curve: ['', Validators.required],
    grade: ['', Validators.required],
    surfaceCondition: ['', Validators.required],
    weather: ['', Validators.required],
    light: ['', Validators.required],
    obstaclePresent: ['', Validators.required],
    speedLimitKmh: this.fb.control<number | null>(null, Validators.required),
    trafficControls: this.fb.control<string[]>([]),
  });

  // One form group per step; the steps after these have nothing to check yet
  private readonly groups: FormGroup[] = [this.crash, this.road];

  ngOnInit() {
    this.loadCodes();
    this.crashService.getDistricts().subscribe((d) => this.districts.set(d));

    const { districtId, municipalityId, crashDate, refYear } = this.crash.controls;

    // District → municipality cascade: a new district clears the municipality
    // and reloads its options
    districtId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      municipalityId.reset({ value: null, disabled: id === null });
      this.municipalities.set([]);
      if (id !== null) {
        this.crashService.getMunicipalities(id).subscribe((m) => this.municipalities.set(m));
      }
    });

    // The reference year follows the crash date until someone edits it by hand
    crashDate.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((date) => {
      if (date && !refYear.dirty) refYear.setValue(Number(date.slice(0, 4)));
    });
  }

  loadCodes() {
    this.codesError.set(false);
    this.crashService.getCodes().subscribe({
      next: (codes) => this.codes.set(codes),
      error: () => this.codesError.set(true),
    });
  }

  // Only moves on when the current step is valid; otherwise every field shows its error
  next() {
    const group = this.groups[this.step()];
    if (group?.invalid) {
      group.markAllAsTouched();
      return;
    }
    const nextStep = Math.min(this.step() + 1, this.steps.length - 1);
    this.step.set(nextStep);
    this.reached.update((r) => Math.max(r, nextStep));
  }

  back() {
    this.step.update((s) => Math.max(0, s - 1));
  }

  goTo(step: number) {
    if (step <= this.reached()) this.step.set(step);
  }

  // Error text is held back until the field has been visited or Next was pressed
  showError(group: FormGroup, name: string): boolean {
    const control = group.get(name);
    return !!control && control.invalid && control.touched;
  }

  toggleTrafficControl(code: string, checked: boolean) {
    const control = this.road.controls.trafficControls;
    const others = control.value.filter((c) => c !== code);
    control.setValue(checked ? [...others, code] : others);
  }
}

// Compared as YYYY-MM-DD strings in local time; toISOString() would shift the day near midnight
export function notInFuture(control: AbstractControl<string | null>): ValidationErrors | null {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return control.value && control.value > today ? { future: true } : null;
}

// A position needs both halves; one on its own can't be placed on the map
export function bothOrNeither(a: string, b: string) {
  return (group: AbstractControl): ValidationErrors | null => {
    const hasA = group.get(a)?.value != null;
    const hasB = group.get(b)?.value != null;
    return hasA === hasB ? null : { halfCoordinate: true };
  };
}
