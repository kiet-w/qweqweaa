export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  placeName: string;
  lat: number;
  lng: number;
}

export interface OptimizedWaypoint {
  waypointIndex: number; // Original index in input array
  tripsIndex: number; // Position in optimized route
  name: string;
}

export interface OptimizationResult {
  waypoints: OptimizedWaypoint[];
  totalDistanceM: number; // Total distance in meters
  totalDurationS: number; // Total duration in seconds
  geometry: string; // Encoded polyline for map rendering
}

export interface DirectionsResult {
  distanceM: number;
  durationS: number;
  geometry: string;
}

// ─── Mapbox API Responses ─────────────────────────────

export interface MapboxGeocodingResponse {
  features: Array<{
    place_name: string;
    center: [number, number]; // [lng, lat]
  }>;
}

export interface MapboxOptimizationResponse {
  code: string;
  trips: Array<{
    distance: number;
    duration: number;
    geometry: string;
  }>;
  waypoints: Array<{
    waypoint_index: number;
    trips_index: number;
    name: string;
  }>;
}

export interface MapboxDirectionsResponse {
  routes: Array<{
    distance: number;
    duration: number;
    geometry: string;
  }>;
}
