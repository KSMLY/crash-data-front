import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  ChangeDetectionStrategy,
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

// Crashes closer than this many pixels are grouped; the default is 80, which holds
// points together long after the map has room to show them apart.
const CLUSTER_RADIUS = 45;

/** The bucket a cluster of {@code count} crashes is drawn with. */
export function clusterBucket(count: number) {
  return CLUSTERS.find((bucket) => count >= bucket.min)!;
}

// At most this many crashes are listed before the popup says how many are left.
const POPUP_LIMIT = 6;

/** Popup for several crashes recorded at one coordinate. */
export function clusterPopupHtml(popups: string[]): string {
  const shown = popups.slice(0, POPUP_LIMIT).join('<hr>');
  const hidden = popups.length - POPUP_LIMIT;
  const more = hidden > 0 ? `<div class="crash-popup-more">and ${hidden} more</div>` : '';
  return `<div class="crash-popup-title">${popups.length} crashes at this location</div>${shown}${more}`;
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
  changeDetection: ChangeDetectionStrategy.Eager,
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
    // Lebanon, whole country in view. The overview doesn't scroll, so the wheel can
    // zoom the map. Its height comes from the window, and Leaflet re-measures on
    // window resize by default (trackResize).
    this.map = L.map(this.mapEl().nativeElement).setView([33.85, 35.85], 8);
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 16 }).addTo(this.map);

    this.markers = L.markerClusterGroup({
      showCoverageOnHover: false,
      // clusters come apart as the reader zooms in, not by clicking them: a tighter
      // radius than the default 80 splits them sooner. Clustering is never switched
      // off, so crashes recorded at the very same coordinates keep their count
      // instead of stacking into what looks like a single crash.
      maxClusterRadius: CLUSTER_RADIUS,
      // Both click behaviours are handled below instead: zooming to a cluster of
      // crashes at one coordinate does nothing, and fanning them out invents
      // distance between crashes that were recorded at the same place.
      spiderfyOnMaxZoom: false,
      zoomToBoundsOnClick: false,
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

    this.markers.on('clusterclick', (event) => this.openCluster(event.propagatedFrom));
  }

  /** Zooms into a cluster, or lists its crashes when zooming cannot separate them. */
  private openCluster(cluster: L.MarkerCluster) {
    if (this.separableByZoom(cluster.getBounds())) {
      cluster.zoomToBounds({ padding: [40, 40] });
      return;
    }
    const popups = cluster
      .getAllChildMarkers()
      .map((marker) => String(marker.getPopup()?.getContent() ?? ''));
    L.popup().setLatLng(cluster.getLatLng()).setContent(clusterPopupHtml(popups)).openOn(this.map!);
  }

  /**
   * Whether these crashes would still be grouped at the deepest zoom the map has.
   * Crashes at one coordinate never come apart, and neither do crashes a few metres
   * apart, so clicking such a cluster has to show them rather than zoom at them.
   */
  private separableByZoom(bounds: L.LatLngBounds): boolean {
    const map = this.map!;
    const zoom = map.getMaxZoom();
    return (
      map
        .project(bounds.getNorthEast(), zoom)
        .distanceTo(map.project(bounds.getSouthWest(), zoom)) > CLUSTER_RADIUS
    );
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
