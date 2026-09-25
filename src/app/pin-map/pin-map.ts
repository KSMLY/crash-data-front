import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { merge } from 'rxjs';
import * as L from 'leaflet';

// Street map with place and road names in English; placing a crash needs landmarks,
// unlike the hotspot map's plain basemap
const TILES =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const ATTRIBUTION = 'Tiles &copy; Esri';

// A material icon rather than Leaflet's default marker, whose image paths break
// under the Angular bundler. Styled by .report-pin in styles.css
const PIN_ICON = L.divIcon({
  className: 'report-pin',
  html: '<span class="material-symbols-outlined">location_on</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 31],
});

// Six decimals is what the latitude/longitude columns store
export function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/** Map for placing a crash: click drops the pin, dragging moves it, and it follows typed coordinates. */
@Component({
  selector: 'app-pin-map',
  templateUrl: './pin-map.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './pin-map.css',
})
export class PinMap {
  latitude = input.required<FormControl<number | null>>();
  longitude = input.required<FormControl<number | null>>();

  private mapEl = viewChild.required<ElementRef<HTMLElement>>('mapEl');
  private destroyRef = inject(DestroyRef);
  private map?: L.Map;
  private pin?: L.Marker;

  constructor() {
    // Leaflet needs the container laid out, which is only true after the first render
    afterNextRender(() => this.createMap());
    this.destroyRef.onDestroy(() => this.map?.remove());
  }

  hasPin(): boolean {
    return this.latitude().value !== null && this.longitude().value !== null;
  }

  clear() {
    this.latitude().setValue(null);
    this.longitude().setValue(null);
  }

  private createMap() {
    this.map = L.map(this.mapEl().nativeElement, { center: [33.85, 35.85], zoom: 8 });
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 18 }).addTo(this.map);
    this.map.on('click', (e: L.LeafletMouseEvent) => this.place(e.latlng));

    // Coming back to the step with a pin already set: start zoomed in on it
    this.showPin();
    if (this.pin) this.map.setView(this.pin.getLatLng(), 14);

    merge(this.latitude().valueChanges, this.longitude().valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.showPin());
  }

  private place(latlng: L.LatLng) {
    for (const [control, value] of [
      [this.latitude(), latlng.lat],
      [this.longitude(), latlng.lng],
    ] as const) {
      control.setValue(round6(value));
      control.markAsDirty();
      control.markAsTouched();
    }
  }

  // The form controls are the source of truth; the pin just mirrors them
  private showPin() {
    const lat = this.latitude().value;
    const lng = this.longitude().value;
    if (lat === null || lng === null) {
      this.pin?.remove();
      this.pin = undefined;
    } else if (this.pin) {
      this.pin.setLatLng([lat, lng]);
    } else {
      this.pin = L.marker([lat, lng], { icon: PIN_ICON, draggable: true }).addTo(this.map!);
      this.pin.on('dragend', () => this.place(this.pin!.getLatLng()));
    }
  }
}
