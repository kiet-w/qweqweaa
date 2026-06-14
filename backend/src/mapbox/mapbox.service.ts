import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Coordinates,
  GeocodingResult,
  OptimizationResult,
  DirectionsResult,
  MapboxGeocodingResponse,
  MapboxOptimizationResponse,
  MapboxDirectionsResponse,
} from './mapbox.types';

@Injectable()
export class MapboxService {
  private readonly logger = new Logger(MapboxService.name);
  private readonly token: string;
  private readonly baseUrl = 'https://api.mapbox.com';

  constructor(private readonly config: ConfigService) {
    this.token = this.config.getOrThrow<string>('MAPBOX_ACCESS_TOKEN');
  }

  /**
   * Geocode an address to lat/lng coordinates.
   * Mapbox Geocoding API v5.
   */
  async geocode(address: string): Promise<GeocodingResult | null> {
    const encoded = encodeURIComponent(address);
    const url =
      `${this.baseUrl}/geocoding/v5/mapbox.places/${encoded}.json` +
      `?access_token=${this.token}&country=VN&limit=1&language=vi`;

    const res = await fetch(url);
    if (!res.ok) {
      this.logger.error(`Geocoding failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = (await res.json()) as MapboxGeocodingResponse;
    const feature = data.features?.[0];
    if (!feature) return null;

    return {
      placeName: feature.place_name,
      lng: feature.center[0],
      lat: feature.center[1],
    };
  }

  /**
   * Optimize route for multiple waypoints (solve TSP).
   * Mapbox Optimization API v1.
   *
   * @param waypoints - Array of coordinates. First = start (warehouse), rest = delivery stops.
   * @param roundtrip - If true, shipper returns to start after last delivery. Default true.
   *
   * Limits: max 12 waypoints per request (free tier).
   */
  async optimizeRoute(
    waypoints: Coordinates[],
    roundtrip = true,
  ): Promise<OptimizationResult | null> {
    if (waypoints.length < 2) return null;
    let targetWaypoints = waypoints;
    if (targetWaypoints.length > 12) {
      this.logger.warn(
        `Too many waypoints (${targetWaypoints.length}), max 12. Truncating.`,
      );
      targetWaypoints = targetWaypoints.slice(0, 12);
    }

    // Mapbox format: lng,lat;lng,lat;...
    const coordinates = targetWaypoints
      .map((w) => `${w.lng},${w.lat}`)
      .join(';');
    const url =
      `${this.baseUrl}/optimized-trips/v1/mapbox/driving/${coordinates}` +
      `?access_token=${this.token}` +
      `&roundtrip=${roundtrip}` +
      `&source=first` +
      `&geometries=polyline` +
      `&overview=full`;

    const res = await fetch(url);
    if (!res.ok) {
      this.logger.error(`Optimization failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = (await res.json()) as MapboxOptimizationResponse;
    if (data.code !== 'Ok' || !data.trips?.length) {
      this.logger.error(`Optimization returned: ${data.code}`);
      return null;
    }

    const trip = data.trips[0];
    return {
      waypoints: data.waypoints.map((wp) => ({
        waypointIndex: wp.waypoint_index,
        tripsIndex: wp.trips_index,
        name: wp.name,
      })),
      totalDistanceM: trip.distance,
      totalDurationS: trip.duration,
      geometry: trip.geometry,
    };
  }

  /**
   * Get driving directions between ordered waypoints.
   * Mapbox Directions API v5.
   */
  async getDirections(
    waypoints: Coordinates[],
  ): Promise<DirectionsResult | null> {
    if (waypoints.length < 2) return null;

    const coordinates = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const url =
      `${this.baseUrl}/directions/v5/mapbox/driving/${coordinates}` +
      `?access_token=${this.token}` +
      `&geometries=polyline` +
      `&overview=full`;

    const res = await fetch(url);
    if (!res.ok) {
      this.logger.error(`Directions failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = (await res.json()) as MapboxDirectionsResponse;
    const route = data.routes?.[0];
    if (!route) return null;

    return {
      distanceM: route.distance,
      durationS: route.duration,
      geometry: route.geometry,
    };
  }
}
