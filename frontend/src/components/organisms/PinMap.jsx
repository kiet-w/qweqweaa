'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export default function PinMap({ lat, lng, popupText }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

    // Initialize map
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lng, lat],
      zoom: 14,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    // Create a marker
    const marker = new mapboxgl.Marker({ color: '#6366f1' })
      .setLngLat([lng, lat]);

    if (popupText) {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="color: #0f1117; padding: 4px; font-family: sans-serif;">
          <p style="margin: 0; font-size: 12px; color: #1e293b; font-weight: 600;">${popupText}</p>
        </div>
      `);
      marker.setPopup(popup);
    }

    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      map.remove();
    };
  }, [lat, lng, popupText]);

  // Update map center and marker position if lat/lng changes
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map) return;
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

    map.setCenter([lng, lat]);
    if (marker) {
      marker.setLngLat([lng, lat]);
    }
  }, [lat, lng]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '250px' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%', minHeight: '250px', borderRadius: 'var(--radius-lg)' }} />
    </div>
  );
}
