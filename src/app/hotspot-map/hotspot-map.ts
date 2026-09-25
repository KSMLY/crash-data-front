import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { formatDate } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { CrashPoint, CrashService } from '../crash';

// Cluster sizes and their breakpoints, largest first; the colour comes from the
// matching class in styles.css.
const CLUSTERS = [
  { min: 150, className: 'high', size: 44 },
  { min: 60, className: 'mid', size: 36 },
  { min: 0, className: 'low', size: 28 },
];

const DOT_SIZE = 12;

/** The bucket a cluster of {@code count} crashes is drawn with. */
export function clusterBucket(count: number) {
  return CLUSTERS.find((bucket) => count >= bucket.min)!;
}

/** Popup contents: the reference, then the date and severity on one line. */
export function popupHtml(point: CrashPoint): string {
  // formatDate, not toLocaleDateString: it gives the same 'Sep' the table's date pipe does
  const date = formatDate(point.crashDate, 'd MMM yyyy', 'en-US');
  const severity = point.severity.charAt(0) + point.severity.slice(1).toLowerCase();
  return `<b>${point.policeRef}</b><br>${date} · ${severity}`;
}

// Muted basemap so the markers carry the colour.
const TILES =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const ATTRIBUTION = 'Tiles &copy; Esri';

@Component({
  selector: 'app-hotspot-map',
  templateUrl: './hotspot-map.html',
  styleUrl: './hotspot-map.css',
})
export class HotspotMap {
  private crashService = inject(CrashService);

  private mapEl = viewChild.required<ElementRef<HTMLElement>>('mapEl');
  private map?: L.Map;
  private markers?: L.MarkerClusterGroup;

  points = signal<CrashPoint[]>([]);
  loading = signal(true);
  error = signal(false);

  constructor() {
    // Leaflet needs the container in the document with its height applied, which
    // is only true once the first render has happened.
    afterNextRender(() => {
      this.createMap();
      this.load();
    });
    inject(DestroyRef).onDestroy(() => this.map?.remove());
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.crashService.getPoints().subscribe({
      next: (points) => {
        this.points.set(points);
        this.draw(points);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private createMap() {
    // Lebanon, whole country in view. The wheel stays with the page: the map sits
    // mid-scroll, so zooming it on scroll would trap the reader.
    this.map = L.map(this.mapEl().nativeElement, { scrollWheelZoom: false }).setView(
      [33.85, 35.85],
      8,
    );
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 16 }).addTo(this.map);

    this.markers = L.markerClusterGroup({
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const bucket = clusterBucket(count);
        return L.divIcon({
          className: '',
          html: `<div class="crash-cluster ${bucket.className}"><span>${count}</span></div>`,
          iconSize: [bucket.size, bucket.size],
        });
      },
    }).addTo(this.map);
  }

  private draw(points: CrashPoint[]) {
    this.markers?.clearLayers();
    this.markers?.addLayers(points.map((point) => this.marker(point)));
  }

  private marker(point: CrashPoint) {
    const icon = L.divIcon({
      className: '',
      html: `<span class="crash-dot" data-severity="${point.severity}"></span>`,
      iconSize: [DOT_SIZE, DOT_SIZE],
    });
    return L.marker([point.latitude, point.longitude], { icon }).bindPopup(popupHtml(point));
  }
}
